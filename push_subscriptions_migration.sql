create table if not exists public.push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.push_subscriptions enable row level security;

-- Create policies
create policy "Users can view their own push subscriptions"
    on public.push_subscriptions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own push subscriptions"
    on public.push_subscriptions for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
    on public.push_subscriptions for delete
    using (auth.uid() = user_id);
