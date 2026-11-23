-- Photographed register data can confirm ghat names before coordinates are supplied.
ALTER TABLE ghats ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE ghats ALTER COLUMN lng DROP NOT NULL;
