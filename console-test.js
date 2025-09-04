// LCSwitcher API Test Console Commands
// ====================================

console.log('🚀 Spúšťam LCSwitcher API testy...');

// Test 1: Minimálna konfigurácia
console.log('\n📝 Test 1: Minimálna konfigurácia (2 jazyky)');
LCSwitcher.destroy();
LCSwitcher.init({
    languages: ["sk|SK", "en|EN"],
    debug: true
});

// Počkaj a then test 2
setTimeout(() => {
    console.log('\n📝 Test 2: Rozšírená konfigurácia (6 jazykov + labely)');
    LCSwitcher.destroy();
    LCSwitcher.init({
        language: 'sk',
        languages: [
            "sk|Slovenčina", 
            "cz|Čeština",
            "en|English", 
            "de|Deutsch",
            "fr|Français",
            "es|Español"
        ],
        languageLabel: 'Vyber jazyk:',
        currencyLabel: 'Vyber menu:',
        allowCurrencyChange: true,
        debug: true
    });
}, 2000);

// Test 3: Iba jazyky, bez meny
setTimeout(() => {
    console.log('\n📝 Test 3: Iba jazyky (bez menového prepínača)');
    LCSwitcher.destroy();
    LCSwitcher.init({
        languages: [
            "sk|Slovenčina", 
            "en|English", 
            "de|Deutsch",
            "ru|Русский"
        ],
        languageLabel: 'Language:',
        allowCurrencyChange: false,  // Skryje currency switcher
        debug: true
    });
}, 4000);

// Test 4: Návrat na pôvodnú konfiguráciu
setTimeout(() => {
    console.log('\n📝 Test 4: Návrat na pôvodnú konfiguráciu');
    LCSwitcher.destroy();
    LCSwitcher.init({
        language: document.documentElement.getAttribute('lang'),
        languages: [
            "sk|Slovenčina",
            "cz|Čeština", 
            "en|English",
            "de|Deutsch",
            "ru|Русский",
            "hu|Magyar"
        ],
        languageChangeUrl: '/Home/ChangeLanguage?code={CODE}',
        allowCurrencyChange: true,
        debug: false
    });
    console.log('\n✅ Testy dokončené! LCSwitcher je v pôvodnom stave.');
}, 6000);

// Helper funkcie pre monitoring
window.LCDebug = {
    status: function() {
        console.log('=== LCSwitcher Status ===');
        console.log('Language switches:', $('.switch.lang').length);
        console.log('Currency switches:', $('.switch.currency').length); 
        console.log('Open dropdowns:', $('.switch.show-options').length);
        console.log('HTML lang:', document.documentElement.lang);
        console.log('Available languages:', $('.switch.lang .options-list li').length);
    },
    
    testDropdown: function() {
        console.log('Testujem dropdown...');
        const $btn = $('.switch.lang .current').first();
        if ($btn.length) {
            $btn.click();
            console.log('Dropdown otvorený');
        } else {
            console.log('❌ Jazykový prepínač nenájdený!');
        }
    },
    
    reinit: function(languages) {
        console.log('Reinicializujem s jazykmi:', languages);
        LCSwitcher.destroy();
        LCSwitcher.init({
            languages: languages || ["sk|SK", "en|EN"],
            debug: true
        });
    }
};

console.log('\n🛠️ Debug nástroje dostupné:');
console.log('- LCDebug.status()     // Zobrazí aktuálny stav');
console.log('- LCDebug.testDropdown() // Otvorí dropdown');  
console.log('- LCDebug.reinit(["sk|SK", "en|EN"]) // Reinicializuje');
console.log('- LCSwitcher.enableDebug() // Zapne debug');
console.log('- LCSwitcher.destroy() // Vyčistí eventy');
