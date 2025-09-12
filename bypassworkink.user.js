// ==UserScript==
// @name         Workink (Volcano) Safe Bypass
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Workink (Volcano) Safe Bypass
// @author       Dyrian + Ẩn danh (Shared)
// @match        https://work.ink/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=work.ink
// ==/UserScript==

(function() {
    "use strict";

    const DEBUG = false;
    const oldLog = unsafeWindow.console.log;
    const oldWarn = unsafeWindow.console.warn;
    const oldError = unsafeWindow.console.error;

    function log(...args) { if (DEBUG) oldLog("[UnShortener]", ...args); }
    function warn(...args) { if (DEBUG) oldWarn("[UnShortener]", ...args); }
    function error(...args) { if (DEBUG) oldError("[UnShortener]", ...args); }

    if (DEBUG) unsafeWindow.console.clear = function() {};

    const container = unsafeWindow.document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "50%";
    container.style.left = "50%";
    container.style.zIndex = 999999;


    const shadow = container.attachShadow({ mode: "closed" });

    const hint = unsafeWindow.document.createElement("div");
    hint.textContent = "Vui lòng hoàn thành CAPTCHA để tiếp tục";

    Object.assign(hint.style, {
        background: "rgba(0,0,0,0.78)",
        color: "#ffffff",
        padding: "14px 20px",
        borderRadius: "10px",
        fontSize: "16px",
        fontFamily: "Inter, Roboto, Arial, sans-serif",
        fontWeight: "600",
        textAlign: "center",
        boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
        pointerEvents: "auto",
        userSelect: "none"
    });

    shadow.appendChild(hint);
    unsafeWindow.document.documentElement.appendChild(container);

    const NAME_MAP = {
        sendMessage: ["sendMessage", "sendMsg", "writeMessage", "writeMsg"],
        onLinkInfo: ["onLinkInfo"],
        onLinkDestination: ["onLinkDestination"]
    };

    function resolveName(obj, candidates) {
        for (let i = 0; i < candidates.length; i++) {
            const name = candidates[i];
            if (typeof obj[name] === "function") {
                return { fn: obj[name], index: i, name };
            }
        }
        return { fn: null, index: -1, name: null };
    }

    let _sessionController = undefined;
    let _sendMessage = undefined;
    let _onLinkInfo = undefined;
    let _onLinkDestination = undefined;

    function getClientPacketTypes() {
        return {
            ANNOUNCE: "c_announce",
            MONETIZATION: "c_monetization",
            SOCIAL_STARTED: "c_social_started",
            RECAPTCHA_RESPONSE: "c_recaptcha_response",
            HCAPTCHA_RESPONSE: "c_hcaptcha_response",
            TURNSTILE_RESPONSE: "c_turnstile_response",
            ADBLOCKER_DETECTED: "c_adblocker_detected",
            FOCUS_LOST: "c_focus_lost",
            OFFERS_SKIPPED: "c_offers_skipped",
            FOCUS: "c_focus",
            WORKINK_PASS_AVAILABLE: "c_workink_pass_available",
            WORKINK_PASS_USE: "c_workink_pass_use",
            PING: "c_ping"
        };
    }

    const startTime = Date.now();

    function createSendMessageProxy() {
        const clientPacketTypes = getClientPacketTypes();

        return function(...args) {
            const packet_type = args[0];
            const packet_data = args[1];

            if (packet_type !== clientPacketTypes.PING) {
                log("Sent message:", packet_type, packet_data);
            }

            if (packet_type === clientPacketTypes.ADBLOCKER_DETECTED) {
                warn("Blocked adblocker detected message to avoid false positive.");
                return;
            }

            if (_sessionController.linkInfo && packet_type === clientPacketTypes.TURNSTILE_RESPONSE) {
                const ret = _sendMessage.apply(this, args);

                hint.textContent = "Captcha đã thành công, đang bypass... (có thể 1 phút)";

                for (const social of _sessionController.linkInfo.socials) {
                    _sendMessage.call(this, clientPacketTypes.SOCIAL_STARTED, {
                        url: social.url
                    });
                }

                for (const monetizationIdx in _sessionController.linkInfo.monetizations) {
                    const monetization = _sessionController.linkInfo.monetizations[monetizationIdx];

                    switch (monetization) {
                        case 22: {
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "readArticles2",
                                payload: {
                                    event: "read"
                                }
                            });
                            break;
                        }

                        case 25: {
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "operaGX",
                                payload: {
                                    event: "start"
                                }
                            });
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "operaGX",
                                payload: {
                                    event: "installClicked"
                                }
                            });
                            fetch('https://work.ink/_api/v2/callback/operaGX', {
                                method: 'POST',
                                mode: 'no-cors',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    'noteligible': true
                                })
                            });
                            break;
                        }

                        case 34: {
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "norton",
                                payload: {
                                    event: "start"
                                }
                            });
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "norton",
                                payload: {
                                    event: "installClicked"
                                }
                            });
                            break;
                        }

                        case 71: {
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "externalArticles",
                                payload: {
                                    event: "start"
                                }
                            });
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "externalArticles",
                                payload: {
                                    event: "installClicked"
                                }
                            });
                            break;
                        }

                        case 45: {
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "pdfeditor",
                                payload: {
                                    event: "installed"
                                }
                            });
                            break;
                        }

                        case 57: {
                            _sendMessage.call(this, clientPacketTypes.MONETIZATION, {
                                type: "betterdeals",
                                payload: {
                                    event: "installed"
                                }
                            });
                            break;
                        }

                        default: {
                            log("Unknown monetization type:", typeof monetization, monetization);
                            break;
                        }
                    }
                }

                return ret;
            }

            return _sendMessage.apply(this, args);
        };
    }

    function createOnLinkInfoProxy() {
        return function(...args) {
            const linkInfo = args[0];

            log("Link info received:", linkInfo);

            Object.defineProperty(linkInfo, "isAdblockEnabled", {
                get() { return false },
                set(newValue) {
                    log("Attempted to set isAdblockEnabled to:", newValue);
                },
                configurable: false,
                enumerable: true
            });

            return _onLinkInfo.apply(this, args);
        };
    }

    function updateHint(waitLeft) {
        hint.textContent = `Đã tìm thấy đích đến, sẽ chuyển hướng sau ${waitLeft} s...`;
    }

    function redirect(url) {
        hint.textContent = "Đang chuyển hướng đến đích đến...";
        window.location.href = url;
    }

    function startCountdown(url, waitLeft) {
        updateHint(waitLeft);

        const interval = setInterval(() => {
            waitLeft -= 1;
            if (waitLeft > 0) {
                updateHint(waitLeft);
            } else {
                clearInterval(interval);
                redirect(url);
            }
        }, 1000);
    }

    function createOnLinkDestinationProxy() {
        return function (...args) {
            const payload = args[0];
            log("Link destination received:", payload);

            const waitTimeSeconds = 30;
            const secondsPassed = (Date.now() - startTime) / 1000;

            if (secondsPassed >= waitTimeSeconds) {
                redirect(payload.url);
            } else {
                startCountdown(payload.url, waitTimeSeconds - secondsPassed);
            }

            return _onLinkDestination.apply(this, args);
        };
    }

    function setupSessionControllerProxy() {
        const sendMessage = resolveName(_sessionController, NAME_MAP.sendMessage);
        const onLinkInfo = resolveName(_sessionController, NAME_MAP.onLinkInfo);
        const onLinkDestination = resolveName(_sessionController, NAME_MAP.onLinkDestination);

        _sendMessage = sendMessage.fn;
        _onLinkInfo = onLinkInfo.fn;
        _onLinkDestination = onLinkDestination.fn;

        const sendMessageProxy = createSendMessageProxy();
        const onLinkInfoProxy = createOnLinkInfoProxy();
        const onLinkDestinationProxy = createOnLinkDestinationProxy();

        Object.defineProperty(_sessionController, sendMessage.name, {
            get() { return sendMessageProxy },
            set(newValue) { _sendMessage = newValue },
            configurable: false,
            enumerable: true
        });

        Object.defineProperty(_sessionController, onLinkInfo.name, {
            get() { return onLinkInfoProxy },
            set(newValue) { _onLinkInfo = newValue },
            configurable: false,
            enumerable: true
        });

        Object.defineProperty(_sessionController, onLinkDestination.name, {
            get() { return onLinkDestinationProxy },
            set(newValue) { _onLinkDestination = newValue },
            configurable: false,
            enumerable: true
        });

        log(`SessionController proxies installed: ${sendMessage.name}, ${onLinkInfo.name}, ${onLinkDestination.name}`);
    }

    function checkForSessionController(target, prop, value, receiver) {
        log("Checking property set:", prop, value);

        if (
            value &&
            typeof value === "object" &&
            resolveName(value, NAME_MAP.sendMessage).fn &&
            resolveName(value, NAME_MAP.onLinkInfo).fn &&
            resolveName(value, NAME_MAP.onLinkDestination).fn &&
            !_sessionController
        ) {
            _sessionController = value;
            log("Intercepted session controller:", _sessionController);
            setupSessionControllerProxy();
        }

        return Reflect.set(target, prop, value, receiver);
    }

    function createComponentProxy(component) {
        return new Proxy(component, {
            construct(target, args) {
                const result = Reflect.construct(target, args);
                log("Intercepted SvelteKit component construction:", target, args, result);

                result.$$.ctx = new Proxy(result.$$.ctx, {
                    set: checkForSessionController
                });

                return result;
            }
        });
    }

    function createNodeResultProxy(result) {
        return new Proxy(result, {
            get(target, prop, receiver) {
                if (prop === "component") {
                    return createComponentProxy(target.component);
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }

    function createNodeProxy(oldNode) {
        return async (...args) => {
            const result = await oldNode(...args);
            log("Intercepted SvelteKit node result:", result);
            return createNodeResultProxy(result);
        };
    }

    function createKitProxy(kit) {
      	if (typeof kit !== "object" || !kit) return [false, kit];

        const originalStart = "start" in kit && kit.start;
        if (!originalStart) return [false, kit];

        const kitProxy = new Proxy(kit, {
            get(target, prop, receiver) {
                if (prop === "start") {
                    return function(...args) {
                        const appModule = args[0];
                        const options = args[2];

                        if (typeof appModule === "object" &&
                            typeof appModule.nodes === "object" &&
                            typeof options === "object" &&
                            typeof options.node_ids === "object") {

                            const oldNode = appModule.nodes[options.node_ids[1]];
                            appModule.nodes[options.node_ids[1]] = createNodeProxy(oldNode);
                        }

                        log("kit.start intercepted!", options);
                        return originalStart.apply(this, args);
                    };
                }
                return Reflect.get(target, prop, receiver);
            }
        });

        return [true, kitProxy];
    }

    function setupSvelteKitInterception() {
        const originalPromiseAll = unsafeWindow.Promise.all;
        let intercepted = false;

        unsafeWindow.Promise.all = async function(promises) {
            const result = originalPromiseAll.call(this, promises);

            if (!intercepted) {
                intercepted = true;

                return await new Promise((resolve) => {
                    result.then(([kit, app, ...args]) => {
                        log("SvelteKit modules loaded");

                        const [success, wrappedKit] = createKitProxy(kit);
                        if (success) {
                            unsafeWindow.Promise.all = originalPromiseAll;

                            log("Wrapped kit ready:", wrappedKit, app);
                        }

                        resolve([wrappedKit, app, ...args]);
                    });
                });
            }

            return await result;
        };
    }

    setupSvelteKitInterception();

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.classList?.contains("adsbygoogle")) {
                        node.remove();
                        log("Removed injected ad:", node);
                    }
                    node.querySelectorAll?.(".adsbygoogle").forEach((el) => {
                        el.remove();
                        log("Removed nested ad:", el);
                    });
                }
            }
        }
    });

    observer.observe(unsafeWindow.document.documentElement, { childList: true, subtree: true });
})();
