import { NextRequest, NextResponse } from 'next/server'
import { approvePolarisUpdate } from '@/lib/polaris-update-checker'
import { createClient } from '@/lib/supabase/server'
import { Octokit } from '@octokit/rest'

/**
 * POST /api/polaris-updates/approve
 * Approve a Polaris update and create GitHub PR
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { updateId, notes } = body

    if (!updateId) {
      return NextResponse.json({ error: 'Update ID required' }, { status: 400 })
    }

    // Get update details
    const { data: update } = await supabase
      .from('polaris_updates')
      .select('*')
      .eq('id', updateId)
      .single()

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    // Approve in database
    const result = await approvePolarisUpdate(updateId, user.id, notes)
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    // Create GitHub PR (if GitHub token is configured)
    let prUrl = null
    if (process.env.GITHUB_TOKEN) {
      try {
        prUrl = await createGitHubPR(update)
      } catch (error) {
        console.error('Failed to create GitHub PR:', error)
        // Don't fail the approval if PR creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      prUrl,
    })
  } catch (error) {
    console.error('Error approving update:', error)
    return NextResponse.json(
      { error: 'Failed to approve update' },
      { status: 500 }
    )
  }
}

/**
 * Create GitHub PR for the approved update
 */
async function createGitHubPR(update: any): Promise<string | null> {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    console.log('GitHub integration not configured')
    return null
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

  const [owner, repo] = process.env.GITHUB_REPO.split('/')
  const branchName = `polaris-update-${update.latest_version}-${Date.now()}`
  
  try {
    // Get default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo })
    const defaultBranch = repoData.default_branch

    // Get latest commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    })

    // Create new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    })

    // Read package.json
    const { data: packageJsonFile } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'package.json',
      ref: branchName
    })

    if (packageJsonFile.type !== 'file' || !packageJsonFile.content) {
      throw new Error('Could not read package.json')
    }

    // Update package.json
    const packageJson = JSON.parse(
      Buffer.from(packageJsonFile.content, 'base64').toString()
    )
    
    packageJson.dependencies[update.package_name] = `^${update.latest_version}`

    // Commit changes
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'package.json',
      message: `chore: update ${update.package_name} to v${update.latest_version}`,
      content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
      branch: branchName,
      sha: packageJsonFile.sha
    })

    // Create PR
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `chore: update Polaris to v${update.latest_version}`,
      head: branchName,
      base: defaultBranch,
      body: `## Polaris Update

**Package**: ${update.package_name}  
**Current Version**: ${update.current_version}  
**New Version**: ${update.latest_version}  
**Update Type**: ${update.update_type.toUpperCase()}

### Changelog
${update.changelog_url}

${update.migration_guide_url ? `### Migration Guide\n${update.migration_guide_url}\n` : ''}

### Approved By
Admin dashboard approval by user ${update.approved_by}

### Testing Checklist
- [ ] Build passes
- [ ] Tests pass
- [ ] Manual testing in Admin portal
- [ ] Manual testing in Vendor portal
- [ ] Manual testing in Collector portal
- [ ] No visual regressions

---

*This PR was automatically created by the Polaris update system.*
`
    })

    return pr.html_url
  } catch (error) {
    console.error('Failed to create GitHub PR:', error)
    throw error
  }
}
