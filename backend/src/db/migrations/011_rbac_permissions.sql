-- Align role-based permissions with the permissions enforced by API routes.
INSERT INTO roles (name) VALUES
  ('editor'),
  ('viewer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name) VALUES
  ('ghats.create'),
  ('ghats.update'),
  ('ghats.publish'),
  ('crowd.override'),
  ('notices.publish'),
  ('audit.read'),
  ('news.publish'),
  ('news.delete'),
  ('issues.read'),
  ('issues.update'),
  ('places.read'),
  ('places.create'),
  ('places.update'),
  ('places.delete'),
  ('places.cache'),
  ('routes.manage'),
  ('seva.manage'),
  ('seva.publish'),
  ('sos.read'),
  ('sos.update'),
  ('transport.read'),
  ('transport.write'),
  ('transport.delete'),
  ('settings.write')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'ghats.create',
  'ghats.update',
  'ghats.publish',
  'news.publish',
  'issues.update',
  'places.read',
  'places.create',
  'places.update',
  'places.cache',
  'routes.manage',
  'seva.manage',
  'seva.publish',
  'transport.read',
  'transport.write'
)
WHERE r.name = 'editor'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('audit.read', 'issues.read', 'places.read', 'transport.read')
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;
