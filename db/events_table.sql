CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'on-going' CHECK (status IN ('on-going', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);
