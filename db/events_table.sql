CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT now()::DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    status TEXT DEFAULT 'on-going',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL
);
