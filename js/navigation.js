function parseRoute(hash) {
    const parts = hash.replace(/^#/, "").split("/");
    const allowedScreens = ["welcome", "dashboard", "explore", "my-learning", "category", "lesson", "activity", "results"];
    if (!allowedScreens.includes(parts[0])) {
        return { screen: "dashboard", categoryId: null, lessonId: null, redirectTo: "#dashboard" };
    }

    const screen = parts[0];
    if (["category", "lesson", "activity"].includes(screen)) {
        const categoryId = parts[1] || null;
        const category = window.LittleLearnersData.categories.find(function (item) { return item.id === categoryId; });
        if (!category) {
            return { screen: "dashboard", categoryId: null, lessonId: null, redirectTo: "#dashboard" };
        }
        if (screen === "lesson" || screen === "activity") {
            const lessonId = parts[2] || null;
            const lessonExists = category.lessons.some(function (item) { return item.id === lessonId; });
            if (!lessonExists) {
                return { screen: "category", categoryId: categoryId, lessonId: null, redirectTo: "#category/" + categoryId };
            }
            return { screen: screen, categoryId: categoryId, lessonId: lessonId };
        }
        return { screen: screen, categoryId: categoryId, lessonId: null };
    }

    if (screen === "results") {
        return { screen: screen, categoryId: null, lessonId: null, attemptId: parts[1] || null };
    }

    return { screen: screen, categoryId: null, lessonId: null };
}

function defaultNavigationParent(screen) {
    if (screen === "dashboard") return "dashboard";
    if (screen === "explore" || screen === "category" || screen === "lesson" || screen === "activity") return "explore";
    if (screen === "my-learning" || screen === "results") return "my-learning";
    return null;
}

function resolveNavigationParent(route, preferredParent) {
    if (route.screen === "dashboard" || route.screen === "explore" || route.screen === "my-learning") {
        return route.screen;
    }
    if ((route.screen === "category" || route.screen === "lesson" || route.screen === "activity" || route.screen === "results") &&
        (preferredParent === "explore" || preferredParent === "my-learning")) {
        return preferredParent;
    }
    return defaultNavigationParent(route.screen);
}

function currentNavigationParent() {
    const currentLink = document.querySelector('.site-nav [aria-current="page"]');
    if (!currentLink) return null;
    return currentLink.getAttribute("href").replace(/^#/, "");
}

function setMobileMenuOpen(isOpen) {
    const toggle = document.querySelector("[data-nav-toggle]");
    const navigation = document.getElementById("site-navigation");
    if (!toggle || !navigation) return;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    navigation.classList.toggle("is-open", isOpen);
}

function showRoute(route, shouldFocus) {
    const screens = document.querySelectorAll("[data-screen]");
    const target = document.getElementById(route.screen);

    if (!target || !target.matches("[data-screen]")) {
        return false;
    }

    setMobileMenuOpen(false);
    document.dispatchEvent(new CustomEvent("littlelearners:navigate", { detail: route }));
    if (route.redirectTo) {
        const redirectedRoute = parseRoute(route.redirectTo);
        redirectedRoute.navParent = resolveNavigationParent(redirectedRoute, null);
        return showRoute(redirectedRoute, shouldFocus);
    }

    screens.forEach(function (screen) {
        screen.hidden = screen !== target;
    });

    document.querySelectorAll(".site-nav [data-screen-link]").forEach(function (link) {
        const isCurrent = link.getAttribute("href") === "#" + route.navParent;
        if (isCurrent) {
            link.setAttribute("aria-current", "page");
            link.classList.add("is-current");
        } else {
            link.removeAttribute("aria-current");
            link.classList.remove("is-current");
        }
    });

    if (shouldFocus) {
        window.requestAnimationFrame(function () {
            const heading = target.querySelector("h1");
            if (heading) {
                heading.setAttribute("tabindex", "-1");
                heading.focus({ preventScroll: true });
            }
            const userReducedMotion = document.documentElement.dataset.reduceMotion === "true";
            const systemReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: userReducedMotion || systemReducedMotion ? "auto" : "smooth" });
        });
    }

    return true;
}

document.addEventListener("click", function (event) {
    const menuToggle = event.target.closest("[data-nav-toggle]");
    if (menuToggle) {
        setMobileMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
        return;
    }

    const link = event.target.closest("[data-screen-link]");
    if (!link) {
        const clickedInMenu = event.target.closest("#site-navigation");
        const clickedInDialog = event.target.closest("#accessibility-dialog");
        if (!clickedInMenu && !clickedInDialog) setMobileMenuOpen(false);
        return;
    }

    const hash = link.getAttribute("href");
    const route = parseRoute(hash);
    route.navParent = resolveNavigationParent(route, currentNavigationParent());
    if (showRoute(route, true)) {
        event.preventDefault();
        const destination = route.redirectTo || hash;
        const destinationRoute = parseRoute(destination);
        destinationRoute.navParent = resolveNavigationParent(destinationRoute, route.redirectTo ? null : route.navParent);
        window.history.pushState({ navParent: destinationRoute.navParent }, "", destination);
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.querySelector("dialog[open]")) return;
    const toggle = document.querySelector("[data-nav-toggle]");
    if (event.key === "Escape" && toggle && toggle.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setMobileMenuOpen(false);
        toggle.focus();
    }
});

window.addEventListener("DOMContentLoaded", function () {
    const route = parseRoute(window.location.hash || "#welcome");
    route.navParent = resolveNavigationParent(route, window.history.state && window.history.state.navParent);
    if (!showRoute(route, false)) {
        showRoute(parseRoute("#welcome"), false);
    }
    const destination = route.redirectTo || window.location.href;
    const destinationRoute = parseRoute(route.redirectTo || window.location.hash || "#welcome");
    destinationRoute.navParent = resolveNavigationParent(destinationRoute, route.redirectTo ? null : route.navParent);
    window.history.replaceState({ navParent: destinationRoute.navParent }, "", destination);
});

window.addEventListener("popstate", function (event) {
    const route = parseRoute(window.location.hash || "#welcome");
    route.navParent = resolveNavigationParent(route, event.state && event.state.navParent);
    if (!showRoute(route, true)) {
        showRoute(parseRoute("#welcome"), true);
    }
    if (route.redirectTo) window.history.replaceState({ navParent: "dashboard" }, "", route.redirectTo);
});

window.LittleLearnersNavigation = {
    go: function (hash) {
        const route = parseRoute(hash);
        route.navParent = resolveNavigationParent(route, currentNavigationParent());
        if (showRoute(route, true)) {
            const destination = route.redirectTo || hash;
            const destinationRoute = parseRoute(destination);
            destinationRoute.navParent = resolveNavigationParent(destinationRoute, route.redirectTo ? null : route.navParent);
            window.history.pushState({ navParent: destinationRoute.navParent }, "", destination);
            return true;
        }
        return false;
    }
};
