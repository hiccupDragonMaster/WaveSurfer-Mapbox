! function(t, e) {
    "object" == typeof exports && "object" == typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : "object" == typeof exports ? exports.HtmlDurationPicker = e() : t.HtmlDurationPicker = e()
}(this, (() => (() => {
    "use strict";
    var t = {
            d: (e, r) => {
                for (var n in r) t.o(r, n) && !t.o(e, n) && Object.defineProperty(e, n, {
                    enumerable: !0,
                    get: r[n]
                })
            },
            o: (t, e) => Object.prototype.hasOwnProperty.call(t, e)
        },
        e = {};
    t.d(e, {
        default: () => r
    });
    /**
     * @preserve
     * html-duration-picker.js
     *
     * @description Turn an html input box to a duration picker, without jQuery
     * @version 2.4.0
     * @author Chif <nadchif@gmail.com>
     * @license Apache-2.0
     *
     */
    const r = function() {
        window.NodeList && !window.NodeList.prototype.forEach && (NodeList.prototype.forEach = Array.prototype.forEach);
        var t = ".html-duration-picker-input-controls-wrapper .html-duration-picker {  text-align: right;  padding-right: 20px;  box-sizing: border-box;  width: 100%;  margin: 0;  cursor: text;}.html-duration-picker-input-controls-wrapper .scroll-btn {  text-align: center;  width: 16px;  padding: 0 4px;  border: none;  cursor: default;  position: absolute;}.html-duration-picker-input-controls-wrapper .caret {  width: 0;  height: 0;  border-style: solid;}.html-duration-picker-input-controls-wrapper .caret.caret-up {  border-width: 0 4px 5px 4px;  border-color: transparent transparent #000 transparent;}.html-duration-picker-input-controls-wrapper .caret.caret-down {  border-width: 5px 4px 0 4px;  border-color: #000 transparent transparent transparent;}.html-duration-picker-input-controls-wrapper .controls {  display: inline-block;  position: absolute;  top: 1px;  padding: 2px 0;}.html-duration-picker-input-controls-wrapper {  display: inline-block;  position: relative;  background: transparent;  padding: 0;  box-sizing: border-box;}",
            e = function(t, e) {
                var r, n = t.target,
                    a = n.selectionStart,
                    o = n.selectionEnd,
                    i = n.value,
                    u = i.indexOf(":"),
                    s = i.lastIndexOf(":");
                return a <= u ? r = "hours" : e || a <= s ? r = "minutes" : !e && a > s && (r = "seconds"), {
                    cursorSelection: r,
                    hideSeconds: e,
                    hourMarker: u,
                    minuteMarker: s,
                    content: i.slice(a, o)
                }
            },
            r = function(t, e) {
                t.setAttribute("data-adjustment-factor", e)
            },
            n = function(t) {
                var e = t.target,
                    r = k(e).maxDuration,
                    n = Math.floor(r / 3600),
                    a = n < 1 ? 0 : n.toString().length;
                (0 === t.target.selectionEnd && 0 === t.target.selectionStart || t.target.selectionEnd - t.target.selectionStart > a || 0 === a) && setTimeout((function() {
                    e.focus(), e.select(), s(e, 1)
                }), 1)
            },
            a = function(t) {
                var n = t.target,
                    a = o(n),
                    i = e(t, a),
                    u = i.cursorSelection,
                    s = i.hourMarker,
                    c = i.minuteMarker;
                if (u) {
                    var l = a ? 3 : 0;
                    switch (u) {
                        case "hours":
                            return r(n, 3600), void t.target.setSelectionRange(0, s);
                        case "minutes":
                            return r(n, 60), void t.target.setSelectionRange(s + 1, c + l);
                        default:
                            return r(n, 1), void t.target.setSelectionRange(c + 1, c + 3)
                    }
                }
            },
            o = function(t) {
                return void 0 !== t.dataset.hideSeconds && "false" !== t.dataset.hideSeconds
            },
            i = function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {
                        bubbles: !1,
                        cancelable: !1
                    },
                    r = document.createEvent("Event");
                return r.initEvent(t, e.bubbles, e.cancelable), r
            },
            u = function(t, e, r) {
                var n = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 1,
                    a = o(t),
                    u = g(e, a),
                    c = t.value;
                t.value = u, !1 !== r && (c != u && t.dispatchEvent(i("change", {
                    bubbles: !0,
                    cancelable: !0
                })), t.dispatchEvent(i("input"))), t.setAttribute("data-adjustment-factor", n), s(t, n)
            },
            
            
            
            s = function(t, e) {
                var r = t.value.indexOf(":"),
                    n = t.value.lastIndexOf(":"),
                    a = o(t),
                    i = t.value == "" ? ("00:00:00").split(":") : t.value.split(":");

                e >= 3600 ? (t.selectionStart = 0, t.selectionEnd = r) 
                : 
                !a && e < 60 ? (t.selectionStart = n + 1, t.selectionEnd = n + 1 + i[2].length) 
                : 
                (t.selectionStart = r + 1, t.selectionEnd = r + 1 + i[1].length, e = 60), 
                    
                e >= 1 && e <= 3600 && t.setAttribute("data-adjustment-factor", e)
            },
            // e = adjustmentFactor
            // t = inputBox
            // r = hourMarker
            // n = minuteMarker
            // a = hideSeconds
            // i = sectioned
            
            // if (adjustmentFactor >= 60 * 60) {
            // inputBox.selectionStart = 0; // hours mode
            // inputBox.selectionEnd = hourMarker;
            // } else if (!hideSeconds && adjustmentFactor < 60) {
            // inputBox.selectionStart = minuteMarker + 1; // seconds mode
            // inputBox.selectionEnd = minuteMarker + 1 + sectioned[2].length;
            // } else {
            // inputBox.selectionStart = hourMarker + 1; // minutes mode
            // inputBox.selectionEnd = hourMarker + 1 + sectioned[1].length;
            // adjustmentFactor = 60;
            // }

            // if (adjustmentFactor >= 1 && adjustmentFactor <= 3600) {
            // inputBox.setAttribute('data-adjustment-factor', adjustmentFactor);
            // }
            
            c = function(t) {
                var e = 1;
                return Number(t.getAttribute("data-adjustment-factor")) > 0 && (e = Number(t.getAttribute("data-adjustment-factor"))), e
            },
            l = function(t, e) {
                var r = c(t),
                    n = h(t.value);
                switch (e) {
                    case "up":
                        n += r;
                        break;
                    case "down":
                        (n -= r) < 0 && (n = 0)
                }
                var a = f(t, n);
                u(t, a, !0, r)
            },
            d = function(t, e) {
                var r = c(t);
                switch (e) {
                    case "left":
                        s(t, r < 3600 ? 60 * r : 3600);
                        break;
                    case "right":
                        s(t, r > 60 ? r / 60 : 1)
                }
            },
            p = function(t, e, r) {
                var n;
                return n = !1 === r ? e ? "^[0-9]{1,9}:(([0-5][0-9]|[0-5]))$" : "^[0-9]{1,9}:(([0-5][0-9]|[0-5])):(([0-5][0-9]|[0-5]))$" : e ? "^[0-9]{1,9}:[0-5][0-9]$" : "^[0-9]{1,9}:[0-5][0-9]:[0-5][0-9]$", RegExp(n).test(t)
            },
            f = function(t, e) {
                var r = k(t),
                    n = r.maxDuration,
                    a = r.minDuration;
                return Math.min(Math.max(e, a), n)
            },
            g = function(t, e) {
                var r = t,
                    n = Math.floor(r / 3600);
                r %= 3600;
                var a = Math.floor(r / 60),
                    o = r % 60,
                    i = String(n).padStart(2, "0"),
                    u = String(a).padStart(2, "0"),
                    s = String(o).padStart(2, "0");
                return e ? "".concat(i, ":").concat(u) : "".concat(i, ":").concat(u, ":").concat(s)
            },
            h = function(t) {
                if (!/:/.test(t)) return 0;
                var e = t.split(":");
                return e.length < 2 ? 0 : Number(e[2] ? e[2] > 59 ? 59 : e[2] : 0) + Number(60 * (e[1] > 59 ? 59 : e[1])) + Number(60 * e[0] * 60)
            },
            v = function(t, e, r) {
                var n, a = t.split(":");
                if (a.length < 2) return e ? "00:00" : "00:00:00";
                if (e) {
                    if (!e && 2 !== a.length) return "00:00";
                    if (isNaN(a[0]) && (a[0] = "00", n = !0), (isNaN(a[1]) || a[1] < 0) && (a[1] = "00", n = !0), (a[1] > 59 || a[1].length > 2) && (a[1] = "59", n = !0), n) return a.join(":")
                } else {
                    if (!e && 3 !== a.length) return "00:00:00";
                    if (isNaN(a[0]) && (a[0] = "00", n = !0), (isNaN(a[1]) || a[1] < 0) && (a[1] = "00", n = !0), (a[1] > 59 || a[1].length > 2) && (a[1] = "59", n = !0), (isNaN(a[2]) || a[2] < 0) && (a[2] = "00", n = !0), (a[2] > 59 || a[2].length > 2) && (a[2] = "59", n = !0), n) return a.join(":")
                }
                return !1
            },
            b = function(t) {
                var e = o(t.target),
                    r = v(t.target.value, e);
                if (!1 === r) {
                    var n = f(t.target, h(t.target.value));
                    t.target.value != g(n, e) && (t.target.value = g(n, e))
                } else {
                    var a = f(t.target, h(r));
                    t.target.value = g(a)
                }
            },
            m = function(t) {
                var r = t.target,
                    n = r.value.split(":"),
                    a = o(r),
                    i = e(t, a).cursorSelection;
                if (n.length < 2) {
                    var c = f(r, A(r));
                    u(r, c, !1)
                } else {
                    var l = k(r).maxDuration,
                        p = Math.floor(l / 3600),
                        g = p < 1 ? 0 : p.toString().length;
                    if (a) {
                        var b = v(t.target.value, !0);
                        if (!1 !== b) {
                            var m = f(t.target, h(b));
                            u(t.target, m, !1)
                        }(g < 1 && "hours" === i || n[0].length >= g && "hours" === i) && (g < 1 && (n[0] = "00"), d(r, "right")), n[1].length >= 2 && "minutes" === i && s(r, 60)
                    } else {
                        var w = v(t.target.value, !1);
                        if (!1 !== w) {
                            var x = f(t.target, h(w));
                            u(t.target, x, !1)
                        }(g < 1 && "hours" === i || n[0].length >= g && "hours" === i) && (g < 1 && (n[0] = "00"), d(r, "right")), n[1].length >= 2 && "minutes" === i && d(r, "right"), n[2].length >= 2 && "seconds" === i && s(r, 1)
                    }
                }
            },
            w = function(t) {
                var e = t.target,
                    r = e.value || e.dataset.duration,
                    n = h(r);
                u(e, f(e, n))
            },
            x = function(t) {
                var r = c(t.target);
                if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Enter"].includes(t.key)) {
                    switch (t.key) {
                        case "ArrowDown":
                            l(t.target, "down"), s(t.target, r);
                            break;
                        case "ArrowUp":
                            l(t.target, "up"), s(t.target, r);
                            break;
                        case "ArrowLeft":
                            d(t.target, "left");
                            break;
                        case "ArrowRight":
                            d(t.target, "right");
                            break;
                        case "Enter":
                            w(t), t.target.blur()
                    }
                    t.preventDefault()
                }
                if ("Tab" === t.key) {
                    var n = c(t.target),
                        a = o(t.target) ? 60 : 1,
                        i = t.shiftKey ? "left" : "right";
                    ("left" === i && n < 3600 || "right" === i && n > a) && (t.preventDefault(), d(t.target, i))
                }
                if (isNaN(t.key) && !["Backspace", "ArrowDown", "ArrowUp", "Tab"].includes(t.key)) return t.preventDefault(), !1;
                var u = t.target,
                    p = o(u),
                    f = e(t, p),
                    g = f.cursorSelection,
                    h = f.content,
                    v = t.target.value.split(":"),
                    b = k(u).maxDuration,
                    m = Math.floor(b / 3600),
                    x = m < 1 ? 0 : m.toString().length;
                "hours" === g && h.length >= x || v[0].length < x ? h.length > x && x > 0 && t.preventDefault() : "minutes" === g && 2 === h.length || v[1].length < 2 || "seconds" === g && 2 === h.length || v[2].length < 2 ? h.length >= 2 && ["6", "7", "8", "9"].includes(t.key) && t.preventDefault() : t.preventDefault()
            },
            y = function(t, e, r) {
                var n = t.dataset[e];
                return n && p(n, o(t)) ? h(n) : r
            },
            E = function(t) {
                return t.preventDefault()
            },
            k = function(t) {
                return {
                    minDuration: y(t, "durationMin", 0),
                    maxDuration: y(t, "durationMax", 359999)
                }
            },
            A = function(t) {
                var e = y(t, "duration", 0),
                    r = h(e);
                return f(t, r)
            },
            S = function(e) {
                if (e) {
                    var r = document.head || document.getElementsByTagName("head")[0],
                        i = document.createElement("style");
                    r.appendChild(i), i.styleSheet ? i.styleSheet.cssText = t : i.appendChild(document.createTextNode(t))
                }
                return document.querySelectorAll("input.html-duration-picker").forEach((function(t) {
                    if ("true" != t.getAttribute("data-upgraded")) {
                        var e, r = t.currentStyle || window.getComputedStyle(t),
                            i = r.marginRight,
                            d = r.marginLeft,
                            f = parseFloat(r.borderRight),
                            g = parseFloat(r.borderLeft),
                            h = parseFloat(r.paddingRight),
                            v = parseFloat(r.paddingLeft),
                            y = parseFloat(r.width);
                        e = "content-box" === r.boxSizing ? y + f + g + h + v : y, t.setAttribute("data-upgraded", !0), t.setAttribute("data-adjustment-factor", 3600);
                        var k = o(t);
                        t.setAttribute("pattern", k ? "^[0-9]{1,9}:[0-5][0-9]$" : "^[0-9]{1,9}:[0-5][0-9]:[0-5][0-9]$"), t.value && p(t.value, o(t)) || u(t, A(t)), t.setAttribute("aria-label", "Duration Picker"), t.addEventListener("keydown", x), t.addEventListener("focus", n), t.addEventListener("mouseup", a), t.addEventListener("change", w), t.addEventListener("input", m), t.addEventListener("blur", b), t.addEventListener("drop", E);
                        var S = document.createElement("button"),
                            D = document.createElement("button"),
                            L = [S, D];
                        S.setAttribute("class", "scroll-btn"), D.setAttribute("class", "scroll-btn"), S.setAttribute("type", "button"), D.setAttribute("type", "button"), S.setAttribute("aria-label", "Increase duration"), D.setAttribute("aria-label", "Decrease duration"), S.setAttribute("style", "height:".concat(t.offsetHeight / 2 - 1, "px !important; top: 1px;")), D.setAttribute("style", "height:".concat(t.offsetHeight / 2 - 1, "px !important; top: ").concat(t.offsetHeight / 2 - 1, "px;"));
                        var N = document.createElement("div"),
                            j = document.createElement("div");
                        N.setAttribute("class", "caret caret-up"), j.setAttribute("class", "caret caret-down "), D.appendChild(j), S.appendChild(N), L.forEach((function(e) {
                            var r;
                            e.addEventListener("mousedown", (function(n) {
                                n.target.style.transform = "translateY(1px)", n.preventDefault(), e == S ? (l(t, "up"), r = setInterval(l, 200, t, "up")) : (l(t, "down"), r = setInterval(l, 200, t, "down"))
                            })), e.addEventListener("keypress", (function(r) {
                                r.target.style.transform = "translateY(1px)", "Enter" == r.key && (r.preventDefault(), l(t, e == S ? "up" : "down"))
                            })), e === S && e.addEventListener("keydown", (function(e) {
                                "Tab" === e.key && e.shiftKey && (t.focus(), t.select(), s(t, 1), e.preventDefault())
                            })), e.addEventListener("keyup", (function(e) {
                                if ("Enter" == e.key) {
                                    var r = c(t);
                                    s(t, r)
                                }
                            })), e.addEventListener("mouseup", (function(e) {
                                e.target.style.transform = "translateY(0)";
                                var n = c(t);
                                s(t, n), clearInterval(r)
                            })), e.addEventListener("mouseleave", (function(e) {
                                if (e.target.style.transform = "translateY(0)", r) {
                                    clearInterval(r);
                                    var n = c(t);
                                    s(t, n)
                                }
                            }))
                        }));
                        var M = document.createElement("div");
                        M.setAttribute("class", "controls"), M.setAttribute("style", "left: ".concat(e - 20, "px; height:").concat(t.offsetHeight, "px;")), M.appendChild(S), M.appendChild(D);
                        var C = document.createElement("div");
                        C.setAttribute("class", "html-duration-picker-input-controls-wrapper"), C.setAttribute("style", "width: ".concat(e, "px; margin-left: ").concat(d, "; margin-right: ").concat(i, ";")), t.parentNode.insertBefore(C, t), C.appendChild(t), C.appendChild(M)
                    }
                })), !0
            };
        return window.addEventListener("DOMContentLoaded", (function() {
            return S(!0)
        })), {
            init: function() {
                return S(!0)
            },
            refresh: function() {
                return S(!1)
            }
        }
    }();
    return e = e.default
})()));
