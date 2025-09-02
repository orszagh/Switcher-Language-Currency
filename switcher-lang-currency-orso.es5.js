/* 
 Language & Currency Switcher (server-driven, accessibility-first)
 ------------------------------------------------------------------
 - Language: Vždy zobrazený, generované <a href> linky
 - Currency: UI prepínač s konfigurovateľným povolením zmeny
 - options:
     language        // Click events
       $(document).on(`click.switch-${type}`, function (e) {
           if (!$(e.target).closest($root).length && $root.hasClass('show-options')) {
               close();
           }
       });

       $(document).on(`keydown.switch-${type}`, function (e) {
           if (e.key === 'Escape' && $root.hasClass('show-options')) {
               close();
           }
       });

       // Responzívne správanie - vyčisti overlay pri zmene na desktop
       let mobileMediaQuery = window.matchMedia('(max-width: 768px)');
       function handleMobileChange(mq) {
           log('Zmena zobrazenia na:', mq.matches ? 'mobilné' : 'desktop');
           if (!mq.matches) {
               // Pri prepnutí na desktop odstráň overlay
               removeMobileOverlay();
           }
       }
       
       if (mobileMediaQuery.addListener) {
           mobileMediaQuery.addListener(handleMobileChange);
       } else if (mobileMediaQuery.addEventListener) {
           mobileMediaQuery.addEventListener('change', handleMobileChange);
       }
   }ané z <html lang>, fallback)
     currency: string (pre currency switcher)
     languages: string[] v tvare "kod|Label" 
     allowCurrencyChange: boolean (default true) – či zobraziť currency switcher
     languageChangeUrl: string (default '/Home/ChangeLanguage?code={CODE}')
     debug: boolean (default false) – debug výpisy do konzoly
*/

'use strict';

(function ($, window, document) {
    'use strict';

    // Debug flag - nastavuje sa cez options.debug
    var DEBUG = false;

    function log() {
        if (DEBUG && console && console.log) {
            console.log.apply(console, ['LCSwitcher:'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    /* -------------------------------
       Pomocné funkcie
       ------------------------------- */
    function getHtmlLang() {
        var lang = (document.documentElement.lang || '').trim();
        return lang ? lang.toLowerCase().split('-')[0] : '';
    }

    function announce(msg) {
        // Vytvor live region ak neexistuje
        var live = document.getElementById('a11y-live');
        if (!live) {
            live = document.createElement('div');
            live.id = 'a11y-live';
            live.className = 'sr-only';
            live.setAttribute('aria-live', 'polite');
            document.body.appendChild(live);
            log('Vytvorený a11y-live región');
        }

        live.textContent = '';
        setTimeout(function () {
            live.textContent = msg;
        }, 10);
        log('Oznámené:', msg);
    }

    /* -------------------------------
       Language Switcher (vždy aktívny s href linkami)
       ------------------------------- */
    function initLanguageSwitch($root, options) {
        var currentLang = options.language || getHtmlLang() || 'sk';
        var urlTemplate = options.languageChangeUrl || '/Home/ChangeLanguage?code={CODE}';

        var $current = $root.find('.current');
        var $listbox = $root.find('[role="listbox"]');

        log('Inicializácia jazykového prepínača', { currentLang: currentLang, urlTemplate: urlTemplate });

        // Nastav aktuálny jazyk v UI
        $current.find('span[aria-hidden="true"]').text(currentLang.toUpperCase());

        // Generuj jazykové položky s href linkami (vždy aktívne)
        if ($listbox.length) {
            $listbox.empty();

            options.languages.forEach(function (_ref) {
                var code = _ref.code;
                var label = _ref.label;

                var liId = 'opt-lang-' + code;
                var isSelected = code === currentLang;
                var href = urlTemplate.replace('{CODE}', encodeURIComponent(code));

                var $li = $('\n          <li id="' + liId + '" role="option" data-lang="' + code + '" aria-selected="' + isSelected + '" class="' + (isSelected ? 'selected' : '') + '">\n            <a href="' + href + '" class="lang-link">\n              ' + label + '\n            </a>\n          </li>\n        ');

                $listbox.append($li);
                log('Pridaná jazyková možnosť:', { code: code, label: label, href: href, isSelected: isSelected });
            });
        }

        var $items = $listbox.find('[role="option"]').attr('tabindex', '-1');
        log('Jazykový prepínač inicializovaný s', $items.length, 'položkami');

        // Vždy pridaj eventy (jazyk je vždy prepínateľný)
        setupDropdownEvents($root, $current, $listbox, $items, 'language');
    }

    /* -------------------------------
       Currency Switcher (iba ak je povolený)
       ------------------------------- */
    function initCurrencySwitch($root, options) {
        var currentCurrency = options.currency || 'eur';

        var $current = $root.find('.current');
        var $listbox = $root.find('[role="listbox"]');
        var $items = $listbox.find('[role="option"]').attr('tabindex', '-1');

        log('Inicializácia menového prepínača', { currentCurrency: currentCurrency });

        // Nastav aktuálnu menu v UI
        $current.find('span[aria-hidden="true"]').text(currentCurrency.toUpperCase());

        // Označ aktuálnu menu
        $items.removeClass('selected').attr('aria-selected', 'false');
        $items.filter('[data-currency="' + currentCurrency + '"]').addClass('selected').attr('aria-selected', 'true');

        log('Menový prepínač inicializovaný s', $items.length, 'položkami');
        setupDropdownEvents($root, $current, $listbox, $items, 'currency');
    }

    /* -------------------------------
       Spoločné dropdown eventy
       ------------------------------- */
    function setupDropdownEvents($root, $current, $listbox, $items, type) {
        function setExpanded(open) {
            $current.attr('aria-expanded', open ? 'true' : 'false');
            if (!open) {
                $listbox.removeAttr('aria-activedescendant');
            } else {
                var $selected = $items.filter('.selected').first();
                if ($selected.length && $selected.attr('id')) {
                    $listbox.attr('aria-activedescendant', $selected.attr('id'));
                }
            }
        }

        function open() {
            log('Otváram dropdown pre', type);

            // Zatvor ostatné
            $('.switch.show-options').not($root).each(function () {
                close($(this));
            });

            $root.addClass('show-options');
            setExpanded(true);

            // Pre mobilné zobrazenie vytvor overlay
            if (window.matchMedia('(max-width: 768px)').matches) {
                createMobileOverlay();
            }

            setTimeout(function () {
                return $root.addClass('anim-options');
            }, 50);
            setTimeout(function () {
                return $root.addClass('show-shadow');
            }, 200);

            // Fokus na selected alebo prvý
            var $toFocus = $items.filter('.selected').first();
            ($toFocus.length ? $toFocus : $items.first()).focus();
            log('Dropdown otvorený, fokus na:', $toFocus.length ? 'vybraný' : 'prvý');
        }

        function close() {
            var targetRoot = arguments.length <= 0 || arguments[0] === undefined ? $root : arguments[0];

            log('Zatváram dropdown pre', type);
            targetRoot.removeClass('anim-options show-shadow');
            var $btn = targetRoot.find('.current');
            $btn.attr('aria-expanded', 'false');
            targetRoot.find('[role="listbox"]').removeAttr('aria-activedescendant');

            // Odstráň mobilný overlay
            removeMobileOverlay();

            setTimeout(function () {
                return targetRoot.removeClass('show-options');
            }, 600);
        }

        // Funkcie pre mobilný overlay
        function createMobileOverlay() {
            if ($('.switch-mobile-overlay').length === 0) {
                (function () {
                    var $overlay = $('<div class="switch-mobile-overlay"></div>');
                    $('body').append($overlay);

                    // Event pre zatvorenie klikom na overlay
                    $overlay.on('click.switch-overlay', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        log('Klik na mobilný overlay - zatváram dropdown');
                        close();
                    });

                    // Aktivuj overlay s animáciou
                    setTimeout(function () {
                        return $overlay.addClass('active');
                    }, 10);
                    log('Vytvorený mobilný overlay');
                })();
            }
        }

        function removeMobileOverlay() {
            var $overlay = $('.switch-mobile-overlay');
            if ($overlay.length > 0) {
                $overlay.removeClass('active');
                setTimeout(function () {
                    $overlay.off('click.switch-overlay').remove();
                    log('Odstránený mobilný overlay');
                }, 300);
            }
        }

        // Button events
        $current.on('click.switch-' + type, function (e) {
            e.stopPropagation();
            if ($root.hasClass('show-options')) {
                close();
            } else {
                open();
            }
        });

        $current.on('keydown.switch-' + type, function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if ($root.hasClass('show-options')) close();else open();
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                open();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        });

        // Items events
        $items.on('click.switch-' + type, function (e) {
            if (type === 'language') {
                // Pre jazyky nechaj prirodzené správanie <a> linku
                var $link = $(this).find('a.lang-link');
                if ($link.length) {
                    log('Klik na jazykový link:', $link.attr('href'));
                    announce('Navigating to ' + $link.text().trim());
                }
            } else {
                // Pre meny spracuj ako callback
                e.stopPropagation();
                e.preventDefault();

                var newCurrency = $(this).data('currency');
                if (newCurrency) {
                    log('Mena zmenená na:', newCurrency);

                    // Aktualizuj UI
                    $current.find('span[aria-hidden="true"]').text(newCurrency.toUpperCase());
                    $items.removeClass('selected').attr('aria-selected', 'false');
                    $(this).addClass('selected').attr('aria-selected', 'true');

                    announce('Currency changed to ' + newCurrency.toUpperCase());

                    // Callback ak existuje
                    if (typeof window.onCurrencyChange === 'function') {
                        window.onCurrencyChange(newCurrency);
                    }
                }

                close();
                $current.focus();
            }
        });

        $items.on('keydown.switch-' + type, function (e) {
            var $focusable = $items;
            var idx = $focusable.index(this);

            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                $current.focus();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                var next = (idx + 1) % $focusable.length;
                var $next = $focusable.eq(next).focus();
                if ($next.attr('id')) {
                    $listbox.attr('aria-activedescendant', $next.attr('id'));
                }
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prev = (idx - 1 + $focusable.length) % $focusable.length;
                var $prev = $focusable.eq(prev).focus();
                if ($prev.attr('id')) {
                    $listbox.attr('aria-activedescendant', $prev.attr('id'));
                }
                return;
            }

            if (e.key === 'Home') {
                e.preventDefault();
                var $first = $focusable.first().focus();
                if ($first.attr('id')) {
                    $listbox.attr('aria-activedescendant', $first.attr('id'));
                }
                return;
            }

            if (e.key === 'End') {
                e.preventDefault();
                var $last = $focusable.last().focus();
                if ($last.attr('id')) {
                    $listbox.attr('aria-activedescendant', $last.attr('id'));
                }
                return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();

                if (type === 'language') {
                    var $link = $(this).find('a.lang-link');
                    if ($link.length) {
                        log('Jazyk vybraný cez klávesnicu:', $link.attr('href'));
                        $link[0].click(); // Prirodzený klik na link
                    }
                } else {
                        // Currency handling
                        $(this).trigger('click');
                    }
                return;
            }
        });

        // Global events
        $(document).on('click.switch-' + type, function (e) {
            if (!$(e.target).closest($root).length && $root.hasClass('show-options')) {
                close();
            }
        });

        $(document).on('keydown.switch-' + type, function (e) {
            if (e.key === 'Escape' && $root.hasClass('show-options')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                log('ESC klávesa - zatváram iba dropdown, nie modálne okno');
                close();
            }
        });
    }

    /* -------------------------------
       API: LCSwitcher.init(options)
       ------------------------------- */
    var LCSwitcher = {
        /**
         * @param {Object} options
         * @param {string=} options.language - aktuálny jazyk (fallback: čítané z <html lang>)
         * @param {string=} options.currency - aktuálna mena pre currency switcher
         * @param {string[]=} options.languages - pole "kod|Label" (default CZ + EN)
         * @param {boolean=} options.allowCurrencyChange - zobraziť currency switcher (default true)
         * @param {string=} options.languageChangeUrl - URL template pre zmenu jazyka
         * @param {boolean=} options.debug - zapnúť debug výpisy (default false)
         */
        init: function init(options) {
            options = options || {};

            // Nastav debug mode
            DEBUG = !!options.debug;
            log('LCSwitcher inicializácia začatá', options);

            // Spracuj jazyky
            var langsInput = options.languages || ["cz|Česky", "en|English"];
            var languages = langsInput.map(String).map(function (s) {
                return s.trim();
            }).filter(Boolean).map(function (pair) {
                var parts = pair.split('|');
                var code = (parts[0] || '').trim();
                var label = (parts[1] || code).trim();
                return { code: code, label: label };
            }).filter(function (x) {
                return x.code;
            });

            log('Spracované jazyky:', languages);

            // Aktuálny jazyk: options.language -> <html lang> -> fallback
            var currentLanguage = options.language || getHtmlLang() || 'sk';
            log('Aktuálny jazyk určený ako:', currentLanguage);

            // Inicializuj language switchers
            var $langSwitchers = $('.switch.lang');
            log('Nájdené jazykové prepínače:', $langSwitchers.length);

            $langSwitchers.each(function () {
                initLanguageSwitch($(this), {
                    language: currentLanguage,
                    languages: languages,
                    languageChangeUrl: options.languageChangeUrl
                });
            });

            // Inicializuj currency switchers (iba ak je povolené)
            if (options.allowCurrencyChange !== false) {
                var $currSwitchers = $('.switch.currency');
                log('Nájdené menové prepínače:', $currSwitchers.length);

                $currSwitchers.each(function () {
                    initCurrencySwitch($(this), {
                        currency: options.currency,
                        allowCurrencyChange: options.allowCurrencyChange
                    });
                });
            } else {
                // Skry všetky currency switchers ak sú zakázané
                $('.switch.currency').hide();
                log('Menové prepínače skryté kvôli allowCurrencyChange: false');
            }

            // Nastav data atribúty na <html>
            if (currentLanguage) {
                document.documentElement.setAttribute('data-lang', currentLanguage);
                log('Nastavený data-lang atribút na:', currentLanguage);
            }
            if (options.currency) {
                document.documentElement.setAttribute('data-currency', options.currency);
                log('Nastavený data-currency atribút na:', options.currency);
            }

            log('LCSwitcher inicializácia dokončená');
        },

        // Debug utility metódy
        enableDebug: function enableDebug() {
            DEBUG = true;
            log('Debug režim zapnutý');
        },

        disableDebug: function disableDebug() {
            DEBUG = false;
        },

        // Cleanup metóda
        destroy: function destroy() {
            log('Odstraňovanie LCSwitcher eventov');

            // Odstráň všetky switch eventy
            $('.switch').off('.switch-language .switch-currency');
            $(document).off('.switch-language .switch-currency');
            $(window).off('.switch-language .switch-currency');

            // Vyčisti pozičné triedy
            $('.switch .options').removeClass('dropdown-top dropdown-right dropdown-left');

            // Zatvor všetky otvorené dropdowns
            $('.switch.show-options').removeClass('show-options anim-options show-shadow');

            log('LCSwitcher eventy odstránené');
        }
    };

    // Export do globálu
    window.LCSwitcher = LCSwitcher;
})(jQuery, window, document);

$(document).ready(function () {
    if (window.LCSwitcher) {
        LCSwitcher.init({
            language: document.documentElement.getAttribute('lang'),
            languages: ["sk|Slovenčina", "cz|Čeština", "en|English", "de|Deutsch", "ru|Русский", "hu|Magyar"],
            languageChangeUrl: '/Home/ChangeLanguage?code={CODE}', // Upraviť podľa potreby
            allowCurrencyChange: true, // Zmeniť na false ak chceš úplne skryť currency switcher
            debug: false // Zmeniť na true pre debug výpisy
        });
    }
});

