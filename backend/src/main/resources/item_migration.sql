-- ============================================================
-- Item Master Migration Script
-- ShopManager — Rice & Grains Shop
-- Run this ONCE against your existing shopdb database.
-- All operations are safe: no sales or transactions are deleted.
-- Foreign keys (item_id in sales) are preserved.
-- ============================================================

USE shopdb;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Rename items whose names changed
-- (Safe — item ID and all foreign keys stay unchanged)
-- ─────────────────────────────────────────────────────────────

-- "10KG GM R/S" → "10KG-GM R/S"
UPDATE items
SET item_name = '10KG-GM R/S', updated_at = NOW()
WHERE item_name = '10KG GM R/S'
  AND (SELECT COUNT(*) FROM (SELECT id FROM items WHERE item_name = '10KG-GM R/S') AS t) = 0;

-- "VUIAVALU" → "VUIAVAIU"
UPDATE items
SET item_name = 'VUIAVAIU', updated_at = NOW()
WHERE item_name = 'VUIAVALU'
  AND (SELECT COUNT(*) FROM (SELECT id FROM items WHERE item_name = 'VUIAVAIU') AS t) = 0;

-- "HMT KA" → "HMT ΚΑ" (Greek Unicode characters as specified in master list)
UPDATE items
SET item_name = 'HMT ΚΑ', updated_at = NOW()
WHERE item_name = 'HMT KA'
  AND (SELECT COUNT(*) FROM (SELECT id FROM items WHERE item_name = 'HMT ΚΑ') AS t) = 0;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Mark obsolete items INACTIVE
-- (Preserves all sales records — soft delete only)
-- ─────────────────────────────────────────────────────────────
UPDATE items
SET status = 'INACTIVE', updated_at = NOW()
WHERE item_name IN (
  '25KG GM CRM',    '25KG GM CRM (S)', '25KG GM KA',      '25KG GM R/S',   '25KG GM T/B',
  'SONA CRM',       'SONA CRM (S)',    'SONA KA',          'SONA R/S',      'SONA T/B',
  'SONA MASOORI',   'SONA MASOORI (S)','BASMATI PREMIUM',  'BASMATI REGULAR','BASMATI LONG',
  'PONNI RAW',      'PONNI BOILED',    'PONNI CRM',        'IDLY RICE',     'DOSA RICE',
  'KOLAM RICE',     'JEERASAMBA',      'MAPPILLAI SAMBA',  'KAVUNI RICE',   'RED RICE',
  'BROWN RICE',     'WHEAT FLOUR 10KG','WHEAT FLOUR 25KG', 'MAIDA 10KG',    'MAIDA 25KG',
  'RAVA 10KG',      'BESAN 5KG',       'TOOR DAL',         'MOONG DAL',     'CHANA DAL',
  'URAD DAL',       'MASOOR DAL',      'RAJMA',             'BLACK CHANA',   'GREEN MOONG',
  'GROUNDNUT OIL 1L','GROUNDNUT OIL 5L','COCONUT OIL 1L',  'SUNFLOWER OIL 1L','SUNFLOWER OIL 5L',
  'SUGAR 1KG',      'SUGAR 5KG',       'SUGAR 25KG',       'JAGGERY 1KG',   'PALM SUGAR',
  'IODIZED SALT 1KG','ROCK SALT 1KG',  'POHA THICK',       'POHA THIN',     'SABUDANA',
  'CORN FLOUR',     'RAGI FLOUR',      'OATS 500G',        'MILLET FOXTAIL','MILLET PEARL',
  'MILLET KODO',    'HMT R/S'
);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Insert new items (INSERT IGNORE skips existing names)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO items (item_name, category, price, status) VALUES
-- 10KG variants
('10KG GM CRM',         'RICE', 0.00, 'ACTIVE'),
('10KG GM CRM (S)',     'RICE', 0.00, 'ACTIVE'),
('10KG GM KA',          'RICE', 0.00, 'ACTIVE'),
('10KG-GM R/S',         'RICE', 0.00, 'ACTIVE'),
('10KG GM T/B',         'RICE', 0.00, 'ACTIVE'),
('10KG HMT BELL(S)',    'RICE', 0.00, 'ACTIVE'),
('10KG HMT CRM',        'RICE', 0.00, 'ACTIVE'),
('10KG HMT CRM(S)',     'RICE', 0.00, 'ACTIVE'),
('10KG HMT (G)',        'RICE', 0.00, 'ACTIVE'),
('10KG HMT LA (S)',     'RICE', 0.00, 'ACTIVE'),
('10KG SW.CRM (S)',     'RICE', 0.00, 'ACTIVE'),
-- 1KG / 5KG variants
('1hmt La(G)',          'RICE', 0.00, 'ACTIVE'),
('5kg Gm M(S)',         'RICE', 0.00, 'ACTIVE'),
('5KG HMT BELL(S)',     'RICE', 0.00, 'ACTIVE'),
('5KG HMT LA (G)',      'RICE', 0.00, 'ACTIVE'),
('5KG HMT LA (S)',      'RICE', 0.00, 'ACTIVE'),
-- AKASHAYA
('AKASHAYA BULL',       'RICE', 0.00, 'ACTIVE'),
('AKASHAYA RED',        'RICE', 0.00, 'ACTIVE'),
-- Basmati brands
('(B) ABIDA',           'BASMATI', 0.00, 'ACTIVE'),
('(B) ALL STAR - G',    'BASMATI', 0.00, 'ACTIVE'),
('BBP',                 'BASMATI', 0.00, 'ACTIVE'),
('(B) DAWAAT',          'BASMATI', 0.00, 'ACTIVE'),
('(B) DAWAAT-XXL',      'BASMATI', 0.00, 'ACTIVE'),
('(B) GG',              'BASMATI', 0.00, 'ACTIVE'),
('BHADAM',              'RICE', 0.00, 'ACTIVE'),
('B) INDIA',            'BASMATI', 0.00, 'ACTIVE'),
('Bondalu',             'RICE', 0.00, 'ACTIVE'),
('(B) REHAAN 1121',     'BASMATI', 0.00, 'ACTIVE'),
('(B) UNITY - SUPER',   'BASMATI', 0.00, 'ACTIVE'),
('(B) WAGHA',           'BASMATI', 0.00, 'ACTIVE'),
-- C
('C/F',                 'RICE', 0.00, 'ACTIVE'),
('Chittu',              'RICE', 0.00, 'ACTIVE'),
-- E
('E',                   'RICE', 0.00, 'ACTIVE'),
-- G
('GAMTLU',              'RICE', 0.00, 'ACTIVE'),
-- GM variants
('GM 777',              'RICE', 0.00, 'ACTIVE'),
('GM BELL',             'RICE', 0.00, 'ACTIVE'),
('GM BELL (S)',         'RICE', 0.00, 'ACTIVE'),
('GM C/C',              'RICE', 0.00, 'ACTIVE'),
('GM CRM',              'RICE', 0.00, 'ACTIVE'),
('GM CRM (G)',          'RICE', 0.00, 'ACTIVE'),
('GM CRM (S)',          'RICE', 0.00, 'ACTIVE'),
('GM HORSE',            'RICE', 0.00, 'ACTIVE'),
('GM ISN',              'RICE', 0.00, 'ACTIVE'),
('GM KA',               'RICE', 0.00, 'ACTIVE'),
('GM KA (S)',           'RICE', 0.00, 'ACTIVE'),
('GM LA',               'RICE', 0.00, 'ACTIVE'),
('GM MILL',             'RICE', 0.00, 'ACTIVE'),
('GM M (P)',            'RICE', 0.00, 'ACTIVE'),
('GM M (S)',            'RICE', 0.00, 'ACTIVE'),
('GM MSR',              'RICE', 0.00, 'ACTIVE'),
('GM MSR (OLD)',        'RICE', 0.00, 'ACTIVE'),
('GM PRINCE (K)',       'RICE', 0.00, 'ACTIVE'),
('GM R/S',              'RICE', 0.00, 'ACTIVE'),
('GM R/S (S)',          'RICE', 0.00, 'ACTIVE'),
('GMT/B (K)',           'RICE', 0.00, 'ACTIVE'),
('GM T/B (OLD)',        'RICE', 0.00, 'ACTIVE'),
('GM T/B (S)',          'RICE', 0.00, 'ACTIVE'),
('GODHAVULU',           'RICE', 0.00, 'ACTIVE'),
('GO TO',               'RICE', 0.00, 'ACTIVE'),
-- HMT variants
('HMT BELL',            'RICE', 0.00, 'ACTIVE'),
('HMT BELL (S)',        'RICE', 0.00, 'ACTIVE'),
('HMT CRM',             'RICE', 0.00, 'ACTIVE'),
('HMT CRM (S)',         'RICE', 0.00, 'ACTIVE'),
('HMT (K)',             'RICE', 0.00, 'ACTIVE'),
('HMT ΚΑ',             'RICE', 0.00, 'ACTIVE'),
('HMT KA (S)',          'RICE', 0.00, 'ACTIVE'),
('HMT LA',              'RICE', 0.00, 'ACTIVE'),
('HMT (M) P',          'RICE', 0.00, 'ACTIVE'),
('HMT (M)S',           'RICE', 0.00, 'ACTIVE'),
('HMT T/B',             'RICE', 0.00, 'ACTIVE'),
('HMT T/B (S)',         'RICE', 0.00, 'ACTIVE'),
-- I / J / K
('IN',                  'RICE', 0.00, 'ACTIVE'),
('JN (G)',              'RICE', 0.00, 'ACTIVE'),
('JN (W)',              'RICE', 0.00, 'ACTIVE'),
('JP (G)',              'RICE', 0.00, 'ACTIVE'),
('JP (W)',              'RICE', 0.00, 'ACTIVE'),
('KADHULLU',            'RICE', 0.00, 'ACTIVE'),
('Kanikulu',            'RICE', 0.00, 'ACTIVE'),
('Korralu',             'RICE', 0.00, 'ACTIVE'),
('KP',                  'RICE', 0.00, 'ACTIVE'),
-- M variants
('M',                   'RICE', 0.00, 'ACTIVE'),
('MASALA',              'RICE', 0.00, 'ACTIVE'),
('Mix',                 'RICE', 0.00, 'ACTIVE'),
('Mixing',              'RICE', 0.00, 'ACTIVE'),
('MJN',                 'RICE', 0.00, 'ACTIVE'),
('M Jona Potu',         'RICE', 0.00, 'ACTIVE'),
('MP',                  'RICE', 0.00, 'ACTIVE'),
('MPTU',                'RICE', 0.00, 'ACTIVE'),
-- N variants
('N',                   'RICE', 0.00, 'ACTIVE'),
('NBPT CRM',            'RICE', 0.00, 'ACTIVE'),
('N (GM)',              'RICE', 0.00, 'ACTIVE'),
('NM',                  'RICE', 0.00, 'ACTIVE'),
-- P variants
('P',                   'RICE', 0.00, 'ACTIVE'),
('Paddy',               'PADDY', 0.00, 'ACTIVE'),
('Paddy(Sw)Old',        'PADDY', 0.00, 'ACTIVE'),
('Paru',                'RICE', 0.00, 'ACTIVE'),
('PL (M)',              'RICE', 0.00, 'ACTIVE'),
('PL R/S',              'RICE', 0.00, 'ACTIVE'),
('PL T/B',              'RICE', 0.00, 'ACTIVE'),
('PLT/B (K)',           'RICE', 0.00, 'ACTIVE'),
('PP',                  'RICE', 0.00, 'ACTIVE'),
('PVR',                 'RICE', 0.00, 'ACTIVE'),
-- R variants
('RGL KA',              'RICE', 0.00, 'ACTIVE'),
('RGL (M)',             'RICE', 0.00, 'ACTIVE'),
('RGL (S)',             'RICE', 0.00, 'ACTIVE'),
('RNL CRM',             'RICE', 0.00, 'ACTIVE'),
-- S variants
('S',                   'RICE', 0.00, 'ACTIVE'),
('Sajjalu',             'RICE', 0.00, 'ACTIVE'),
('S Gula',              'RICE', 0.00, 'ACTIVE'),
('SMG',                 'RICE', 0.00, 'ACTIVE'),
('SMP',                 'RICE', 0.00, 'ACTIVE'),
('SOLU',                'RICE', 0.00, 'ACTIVE'),
('SP',                  'RICE', 0.00, 'ACTIVE'),
-- SW variants
('SW BELL (S)',         'RICE', 0.00, 'ACTIVE'),
('SW CRM (S)',          'RICE', 0.00, 'ACTIVE'),
('SW HORSE',            'RICE', 0.00, 'ACTIVE'),
('SW KA (S)',           'RICE', 0.00, 'ACTIVE'),
('SW LA (S)',           'RICE', 0.00, 'ACTIVE'),
('SW MILL',             'RICE', 0.00, 'ACTIVE'),
('SW OLD',              'RICE', 0.00, 'ACTIVE'),
('SW (P)',              'RICE', 0.00, 'ACTIVE'),
('SW PRINCE',           'RICE', 0.00, 'ACTIVE'),
('SW PRINCE (OLD)',     'RICE', 0.00, 'ACTIVE'),
('SW R/S',              'RICE', 0.00, 'ACTIVE'),
('SW R/S (K)',          'RICE', 0.00, 'ACTIVE'),
('SW RS (S)',           'RICE', 0.00, 'ACTIVE'),
('SW (S)',              'RICE', 0.00, 'ACTIVE'),
('SW T/B',              'RICE', 0.00, 'ACTIVE'),
('SW T/B (K)',          'RICE', 0.00, 'ACTIVE'),
('SW T/B (S)',          'RICE', 0.00, 'ACTIVE'),
-- T variants
('T MILL',              'RICE', 0.00, 'ACTIVE'),
('T NO-1',              'RICE', 0.00, 'ACTIVE'),
('T NO-2',              'RICE', 0.00, 'ACTIVE'),
('TPP',                 'RICE', 0.00, 'ACTIVE'),
-- V
('VS Gullu',            'RICE', 0.00, 'ACTIVE'),
('VUIAVAIU',            'RICE', 0.00, 'ACTIVE');

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Ensure all master list items are ACTIVE
-- (Re-activates any that were accidentally deactivated)
-- ─────────────────────────────────────────────────────────────
UPDATE items SET status = 'ACTIVE', updated_at = NOW()
WHERE item_name IN (
  '10KG GM CRM', '10KG GM CRM (S)', '10KG GM KA', '10KG-GM R/S', '10KG GM T/B',
  '10KG HMT BELL(S)', '10KG HMT CRM', '10KG HMT CRM(S)', '10KG HMT (G)', '10KG HMT LA (S)',
  '10KG SW.CRM (S)', '1hmt La(G)', '5kg Gm M(S)', '5KG HMT BELL(S)', '5KG HMT LA (G)', '5KG HMT LA (S)',
  'AKASHAYA BULL', 'AKASHAYA RED',
  '(B) ABIDA', '(B) ALL STAR - G', 'BBP', '(B) DAWAAT', '(B) DAWAAT-XXL', '(B) GG',
  'BHADAM', 'B) INDIA', 'Bondalu', '(B) REHAAN 1121', '(B) UNITY - SUPER', '(B) WAGHA',
  'C/F', 'Chittu', 'E', 'GAMTLU',
  'GM 777', 'GM BELL', 'GM BELL (S)', 'GM C/C', 'GM CRM', 'GM CRM (G)', 'GM CRM (S)',
  'GM HORSE', 'GM ISN', 'GM KA', 'GM KA (S)', 'GM LA', 'GM MILL', 'GM M (P)', 'GM M (S)',
  'GM MSR', 'GM MSR (OLD)', 'GM PRINCE (K)', 'GM R/S', 'GM R/S (S)', 'GMT/B (K)',
  'GM T/B (OLD)', 'GM T/B (S)', 'GODHAVULU', 'GO TO',
  'HMT BELL', 'HMT BELL (S)', 'HMT CRM', 'HMT CRM (S)', 'HMT (K)', 'HMT ΚΑ',
  'HMT KA (S)', 'HMT LA', 'HMT (M) P', 'HMT (M)S', 'HMT T/B', 'HMT T/B (S)',
  'IN', 'JN (G)', 'JN (W)', 'JP (G)', 'JP (W)',
  'KADHULLU', 'Kanikulu', 'Korralu', 'KP',
  'M', 'MASALA', 'Mix', 'Mixing', 'MJN', 'M Jona Potu', 'MP', 'MPTU',
  'N', 'NBPT CRM', 'N (GM)', 'NM',
  'P', 'Paddy', 'Paddy(Sw)Old', 'Paru', 'PL (M)', 'PL R/S', 'PL T/B', 'PLT/B (K)',
  'PP', 'PVR',
  'RGL KA', 'RGL (M)', 'RGL (S)', 'RNL CRM',
  'S', 'Sajjalu', 'S Gula', 'SMG', 'SMP', 'SOLU', 'SP',
  'SW BELL (S)', 'SW CRM (S)', 'SW HORSE', 'SW KA (S)', 'SW LA (S)', 'SW MILL',
  'SW OLD', 'SW (P)', 'SW PRINCE', 'SW PRINCE (OLD)', 'SW R/S', 'SW R/S (K)',
  'SW RS (S)', 'SW (S)', 'SW T/B', 'SW T/B (K)', 'SW T/B (S)',
  'T MILL', 'T NO-1', 'T NO-2', 'TPP',
  'VS Gullu', 'VUIAVAIU'
);

-- ─────────────────────────────────────────────────────────────
-- Verification
-- ─────────────────────────────────────────────────────────────
SELECT status, COUNT(*) as count FROM items GROUP BY status;
SELECT item_name, status FROM items WHERE status = 'ACTIVE' ORDER BY item_name;
