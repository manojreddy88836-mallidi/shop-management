package com.shopmanager;

import com.shopmanager.entity.Item;
import com.shopmanager.entity.User;
import com.shopmanager.repository.ItemRepository;
import com.shopmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Runs on every application startup.
 * - Ensures the admin user exists with a correct BCrypt password.
 * - Syncs the item master list: renames changed items, inserts missing items,
 *   marks obsolete items INACTIVE. No sales data is ever touched.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Known renames: OLD name → NEW name ───────────────────────────────────
    // These are applied before any insert/deactivate logic.
    private static final Map<String, String> RENAMES = new LinkedHashMap<>();
    static {
        RENAMES.put("10KG GM R/S",  "10KG-GM R/S");   // hyphen change
        RENAMES.put("VUIAVALU",     "VUIAVAIU");        // spelling correction
        RENAMES.put("HMT KA",       "HMT \u039A\u0391"); // Latin KA → Greek ΚΑ (as per master list)
    }

    // ── Master Item List ──────────────────────────────────────────────────────
    // Format: { itemName, category }
    // Prices are entered manually in the sale form — stored as 0.00 here.
    private static final String[][] MASTER_ITEMS = {
        // ── 10KG variants ────────────────────────────────────────────────────
        { "10KG GM CRM",         "RICE"     },
        { "10KG GM CRM (S)",     "RICE"     },
        { "10KG GM KA",          "RICE"     },
        { "10KG-GM R/S",         "RICE"     },
        { "10KG GM T/B",         "RICE"     },
        { "10KG HMT BELL(S)",    "RICE"     },
        { "10KG HMT CRM",        "RICE"     },
        { "10KG HMT CRM(S)",     "RICE"     },
        { "10KG HMT (G)",        "RICE"     },
        { "10KG HMT LA (S)",     "RICE"     },
        { "10KG SW.CRM (S)",     "RICE"     },
        // ── 1KG / 5KG variants ───────────────────────────────────────────────
        { "1hmt La(G)",          "RICE"     },
        { "5kg Gm M(S)",         "RICE"     },
        { "5KG HMT BELL(S)",     "RICE"     },
        { "5KG HMT LA (G)",      "RICE"     },
        { "5KG HMT LA (S)",      "RICE"     },
        // ── AKASHAYA ─────────────────────────────────────────────────────────
        { "AKASHAYA BULL",       "RICE"     },
        { "AKASHAYA RED",        "RICE"     },
        // ── Basmati brands ───────────────────────────────────────────────────
        { "(B) ABIDA",           "BASMATI"  },
        { "(B) ALL STAR - G",    "BASMATI"  },
        { "BBP",                 "BASMATI"  },
        { "(B) DAWAAT",          "BASMATI"  },
        { "(B) DAWAAT-XXL",      "BASMATI"  },
        { "(B) GG",              "BASMATI"  },
        { "BHADAM",              "RICE"     },
        { "B) INDIA",            "BASMATI"  },
        { "Bondalu",             "RICE"     },
        { "(B) REHAAN 1121",     "BASMATI"  },
        { "(B) UNITY - SUPER",   "BASMATI"  },
        { "(B) WAGHA",           "BASMATI"  },
        // ── C ────────────────────────────────────────────────────────────────
        { "C/F",                 "RICE"     },
        { "Chittu",              "RICE"     },
        // ── E ────────────────────────────────────────────────────────────────
        { "E",                   "RICE"     },
        // ── G ────────────────────────────────────────────────────────────────
        { "GAMTLU",              "RICE"     },
        // ── GM variants ──────────────────────────────────────────────────────
        { "GM 777",              "RICE"     },
        { "GM BELL",             "RICE"     },
        { "GM BELL (S)",         "RICE"     },
        { "GM C/C",              "RICE"     },
        { "GM CRM",              "RICE"     },
        { "GM CRM (G)",          "RICE"     },
        { "GM CRM (S)",          "RICE"     },
        { "GM HORSE",            "RICE"     },
        { "GM ISN",              "RICE"     },
        { "GM KA",               "RICE"     },
        { "GM KA (S)",           "RICE"     },
        { "GM LA",               "RICE"     },
        { "GM MILL",             "RICE"     },
        { "GM M (P)",            "RICE"     },
        { "GM M (S)",            "RICE"     },
        { "GM MSR",              "RICE"     },
        { "GM MSR (OLD)",        "RICE"     },
        { "GM PRINCE (K)",       "RICE"     },
        { "GM R/S",              "RICE"     },
        { "GM R/S (S)",          "RICE"     },
        { "GMT/B (K)",           "RICE"     },
        { "GM T/B (OLD)",        "RICE"     },
        { "GM T/B (S)",          "RICE"     },
        { "GODHAVULU",           "RICE"     },
        { "GO TO",               "RICE"     },
        // ── HMT variants ─────────────────────────────────────────────────────
        { "HMT BELL",            "RICE"     },
        { "HMT BELL (S)",        "RICE"     },
        { "HMT CRM",             "RICE"     },
        { "HMT CRM (S)",         "RICE"     },
        { "HMT (K)",             "RICE"     },
        { "HMT \u039A\u0391",    "RICE"     },   // HMT ΚΑ
        { "HMT KA (S)",          "RICE"     },
        { "HMT LA",              "RICE"     },
        { "HMT (M) P",           "RICE"     },
        { "HMT (M)S",            "RICE"     },
        { "HMT T/B",             "RICE"     },
        { "HMT T/B (S)",         "RICE"     },
        // ── I / J / K ────────────────────────────────────────────────────────
        { "IN",                  "RICE"     },
        { "JN (G)",              "RICE"     },
        { "JN (W)",              "RICE"     },
        { "JP (G)",              "RICE"     },
        { "JP (W)",              "RICE"     },
        { "KADHULLU",            "RICE"     },
        { "Kanikulu",            "RICE"     },
        { "Korralu",             "RICE"     },
        { "KP",                  "RICE"     },
        // ── M variants ───────────────────────────────────────────────────────
        { "M",                   "RICE"     },
        { "MASALA",              "RICE"     },
        { "Mix",                 "RICE"     },
        { "Mixing",              "RICE"     },
        { "MJN",                 "RICE"     },
        { "M Jona Potu",         "RICE"     },
        { "MP",                  "RICE"     },
        { "MPTU",                "RICE"     },
        // ── N variants ───────────────────────────────────────────────────────
        { "N",                   "RICE"     },
        { "NBPT CRM",            "RICE"     },
        { "N (GM)",              "RICE"     },
        { "NM",                  "RICE"     },
        // ── P variants ───────────────────────────────────────────────────────
        { "P",                   "RICE"     },
        { "Paddy",               "PADDY"    },
        { "Paddy(Sw)Old",        "PADDY"    },
        { "Paru",                "RICE"     },
        { "PL (M)",              "RICE"     },
        { "PL R/S",              "RICE"     },
        { "PL T/B",              "RICE"     },
        { "PLT/B (K)",           "RICE"     },
        { "PP",                  "RICE"     },
        { "PVR",                 "RICE"     },
        // ── R variants ───────────────────────────────────────────────────────
        { "RGL KA",              "RICE"     },
        { "RGL (M)",             "RICE"     },
        { "RGL (S)",             "RICE"     },
        { "RNL CRM",             "RICE"     },
        // ── S variants ───────────────────────────────────────────────────────
        { "S",                   "RICE"     },
        { "Sajjalu",             "RICE"     },
        { "S Gula",              "RICE"     },
        { "SMG",                 "RICE"     },
        { "SMP",                 "RICE"     },
        { "SOLU",                "RICE"     },
        { "SP",                  "RICE"     },
        // ── SW variants ──────────────────────────────────────────────────────
        { "SW BELL (S)",         "RICE"     },
        { "SW CRM (S)",          "RICE"     },
        { "SW HORSE",            "RICE"     },
        { "SW KA (S)",           "RICE"     },
        { "SW LA (S)",           "RICE"     },
        { "SW MILL",             "RICE"     },
        { "SW OLD",              "RICE"     },
        { "SW (P)",              "RICE"     },
        { "SW PRINCE",           "RICE"     },
        { "SW PRINCE (OLD)",     "RICE"     },
        { "SW R/S",              "RICE"     },
        { "SW R/S (K)",          "RICE"     },
        { "SW RS (S)",           "RICE"     },
        { "SW (S)",              "RICE"     },
        { "SW T/B",              "RICE"     },
        { "SW T/B (K)",          "RICE"     },
        { "SW T/B (S)",          "RICE"     },
        // ── T variants ───────────────────────────────────────────────────────
        { "T MILL",              "RICE"     },
        { "T NO-1",              "RICE"     },
        { "T NO-2",              "RICE"     },
        { "TPP",                 "RICE"     },
        // ── V ────────────────────────────────────────────────────────────────
        { "VS Gullu",            "RICE"     },
        { "VUIAVAIU",            "RICE"     },
    };

    public DataInitializer(UserRepository userRepository,
                           ItemRepository itemRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initAdmin();
        removeWorkerIfExists();   // one-time cleanup
        syncItems();
    }

    /** Remove WORKER account if it exists — only admin should exist. */
    private void removeWorkerIfExists() {
        userRepository.findByUsername("WORKER").ifPresent(user -> {
            userRepository.delete(user);
            log.info("🗑️  WORKER user removed — admin-only mode.");
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin user seeding
    // ─────────────────────────────────────────────────────────────────────────
    private void initAdmin() {
        userRepository.findByUsername("admin").ifPresentOrElse(
            user -> {
                if (!passwordEncoder.matches("admin123", user.getPassword())) {
                    user.setPassword(passwordEncoder.encode("admin123"));
                    userRepository.save(user);
                    log.info("✅ Admin password re-hashed.");
                } else {
                    log.info("✅ Admin user exists with valid BCrypt password.");
                }
            },
            () -> {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                userRepository.save(admin);
                log.info("✅ Admin user created.");
            }
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Item master sync — idempotent, runs every startup
    // ─────────────────────────────────────────────────────────────────────────
    protected void syncItems() {
        int renamed    = applyRenames();
        int inserted   = insertMissingItems();
        int activated  = reactivateItems();
        int deactivated = deactivateObsoleteItems();

        long total = itemRepository.countByStatus("ACTIVE");
        log.info("✅ Item master sync: renamed={}, inserted={}, activated={}, deactivated={} | active={}",
                 renamed, inserted, activated, deactivated, total);
    }

    /**
     * Apply known renames (old name → new name).
     * Only updates if the old name exists AND the new name doesn't.
     */
    private int applyRenames() {
        int count = 0;
        for (Map.Entry<String, String> entry : RENAMES.entrySet()) {
            String oldName = entry.getKey();
            String newName = entry.getValue();
            Optional<Item> existing = itemRepository.findByItemNameIgnoreCase(oldName);
            if (existing.isPresent() && itemRepository.findByItemNameIgnoreCase(newName).isEmpty()) {
                existing.get().setItemName(newName);
                itemRepository.save(existing.get());
                log.info("  ↔ Renamed: '{}' → '{}'", oldName, newName);
                count++;
            }
        }
        return count;
    }

    /**
     * Insert items from the master list that don't yet exist.
     * Uses exact case-sensitive name match after case-insensitive check.
     */
    private int insertMissingItems() {
        int count = 0;
        for (String[] row : MASTER_ITEMS) {
            String name     = row[0];
            String category = row[1];
            if (itemRepository.findByItemNameIgnoreCase(name).isEmpty()) {
                Item item = new Item();
                item.setItemName(name);
                item.setCategory(category);
                item.setPrice(BigDecimal.ZERO);
                item.setStatus("ACTIVE");
                itemRepository.save(item);
                count++;
            }
        }
        return count;
    }

    /**
     * Ensure all master-list items have status=ACTIVE
     * (in case any were accidentally deactivated via the UI).
     */
    private int reactivateItems() {
        int count = 0;
        Set<String> masterNamesLower = Arrays.stream(MASTER_ITEMS)
                .map(row -> row[0].toLowerCase())
                .collect(Collectors.toSet());
        for (Item item : itemRepository.findAll()) {
            if (masterNamesLower.contains(item.getItemName().toLowerCase())
                    && !"ACTIVE".equals(item.getStatus())) {
                item.setStatus("ACTIVE");
                itemRepository.save(item);
                count++;
            }
        }
        return count;
    }

    /**
     * Mark INACTIVE any item that is currently ACTIVE but is NOT in the master list.
     * Preserves all foreign keys (sales.item_id still valid).
     */
    private int deactivateObsoleteItems() {
        Set<String> masterNamesLower = Arrays.stream(MASTER_ITEMS)
                .map(row -> row[0].toLowerCase())
                .collect(Collectors.toSet());
        int count = 0;
        for (Item item : itemRepository.findByStatus("ACTIVE")) {
            if (!masterNamesLower.contains(item.getItemName().toLowerCase())) {
                item.setStatus("INACTIVE");
                itemRepository.save(item);
                log.info("  ⊘ Deactivated obsolete item: '{}'", item.getItemName());
                count++;
            }
        }
        return count;
    }
}
