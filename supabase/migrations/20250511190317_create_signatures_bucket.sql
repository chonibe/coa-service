-- Create a new storage bucket for signatures
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true);

-- Set up storage policies for the signatures bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'signatures' );

create policy "Authenticated users can upload signatures"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
    and auth.role() = 'authenticated'
  );

create policy "Users can update their own signatures"
  on storage.objects for update
  using (
    bucket_id = 'signatures'
    and auth.uid() = owner
  );

create policy "Users can delete their own signatures"
  on storage.objects for delete
  using (
    bucket_id = 'signatures'
    and auth.uid() = owner
  ); 