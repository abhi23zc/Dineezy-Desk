create table if not exists public.collection_assignees (
    id          uuid        primary key default gen_random_uuid(),

    collection_id uuid      not null
        references public.collections(id)
        on delete cascade,

    user_id     uuid        not null
        references public.profiles(id)
        on delete cascade,

    assigned_at timestamptz not null default now(),

    unique(collection_id, user_id)
);

alter table public.collection_assignees owner to postgres;

-- Grant access to all Supabase roles (matches the rest of the schema)
grant all on table public.collection_assignees to anon;
grant all on table public.collection_assignees to authenticated;
grant all on table public.collection_assignees to service_role;
