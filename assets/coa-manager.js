(() => {
  const config = window.shopifyAppConfig
  if (!config) {
    console.error('Shopify app config not found')
    return
  }

  const script = document.createElement("script")
  script.src = `${config.baseUrl}/coa-manager.js`
  script.async = true
  document.getElementById("coa-manager-root").appendChild(script)
})() 