
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

document.body.classList.add("is-loading");

const pageLoader = document.querySelector(".page-loader");
const pageImages = [...document.querySelectorAll("img")];
const navToggler = document.querySelector(".nav-toggler");
const menu = document.querySelector(".menu");
const menuContainer = document.querySelector(".menu-container");
const menuColumns = document.querySelectorAll(".menu-col");
const menuLinks = document.querySelectorAll(".menu-col a");
let resourcesReady = false;
let presentationComplete = false;
let isMenuOpen = false;
let isNavHidden = false;
let menuTimeline;

menuContainer.addEventListener("transitionend", (event) => {
  if (event.propertyName !== "transform" || isMenuOpen) return;

  menu.setAttribute("aria-hidden", "true");
  lenis.start();
  syncMenuButtonVisibility();
});

const syncMenuButtonVisibility = () => {
  navToggler.classList.toggle(
    "is-visible",
    resourcesReady && presentationComplete && (!isNavHidden || isMenuOpen),
  );
};

window.setTimeout(() => {
  pageLoader.classList.add("is-palette-visible");
}, 1800);

const minimumLoaderTime = new Promise((resolve) =>
  window.setTimeout(resolve, 3000),
);
const imagesReady = Promise.all(
  pageImages.map((image) => image.decode().catch(() => undefined)),
);
const pageResources = Promise.all([
  new Promise((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }
    window.addEventListener("load", resolve, { once: true });
  }),
  document.fonts.ready,
  imagesReady,
  minimumLoaderTime,
]);

pageResources.then(() => {
  pageLoader.classList.add("is-complete");
  document.body.classList.remove("is-loading");
  resourcesReady = true;
  syncMenuButtonVisibility();
});

const lenis = new Lenis({
  autoRaf: false,
  duration: 1.2,
  respectReducedMotion: false,
  smoothWheel: true,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const spotlightGallery = document.querySelector(".hero-spotlight-gallery");
const spotlightImages = document.querySelectorAll(
  ".hero-spotlight-gallery img",
);
const logo = document.querySelector(".logo");
const heroButton = document.querySelector(".hero-header .btn");
const heroFooter = document.querySelector(".hero-footer");
const heroInner = document.querySelector(".hero-inner");

const lerp = (from, to, t) => from + (to - from) * t;

const mapRange = (value, rangeStart, rangeEnd) =>
  gsap.utils.clamp(0, 1, (value - rangeStart) / (rangeEnd - rangeStart));

const headlineSplit = SplitText.create(".hero-header h3", {
  type: "words",
  wordsClass: "word",
});

const headerFadeTarget = [...headlineSplit.words, heroButton];
const headerFadeStep = 0.05;
const headerFadeDuration = 0.1;
gsap.set(headerFadeTarget, { opacity: 0 });

const MOBILE_BREAKPOINT = 1000;

let logoStartScale = 6;
gsap.matchMedia().add(`(max-width: ${MOBILE_BREAKPOINT}px)`, () => {
  logoStartScale = 2;
  return () => (logoStartScale = 6);
});

ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 4}px`,
  pin: true,
  pinSpacing: false,
  onUpdate: (self) => {
    const scrollProgress = self.progress;
    presentationComplete = scrollProgress >= 0.75;

    if (self.direction === -1) {
      isNavHidden = false;
    } else if (self.direction === 1 && scrollProgress >= 1) {
      isNavHidden = true;
    }

    syncMenuButtonVisibility();

    const galleryProgress = mapRange(scrollProgress, 0, 0.75);
    const galleryScale = lerp(1, 0.5, galleryProgress);
    gsap.set(spotlightGallery, { scale: galleryScale });

    const imageScale = lerp(1.25, 1, galleryProgress);
    gsap.set(spotlightImages, { scale: imageScale });

    const logoScale = lerp(logoStartScale, 1, galleryProgress);

    const oneRem = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const logoScaledHeight = logo.offsetHeight * logoScale;
    const logoTravelDistance =
      window.innerHeight - logoScaledHeight - oneRem * 4;

    gsap.set(logo, {
      scale: logoScale,
      y: -logoTravelDistance * galleryProgress,
    });

    const footerProgress = mapRange(scrollProgress, 0.05, 0.25);
    gsap.set(heroFooter, {
      scale: lerp(1, 0.75, footerProgress),
      filter: `blur(${lerp(0, 20, footerProgress)}px)`,
      opacity: lerp(1, 0, footerProgress),
    });

    headerFadeTarget.forEach((target, index) => {
      const targetStart = 0.1 + index * headerFadeStep;
      const targetProgress = mapRange(
        scrollProgress,
        targetStart,
        targetStart + headerFadeDuration,
      );
      gsap.set(target, { opacity: targetProgress });
    });
  },
});

ScrollTrigger.create({
  trigger: ".studio",
  start: "top bottom",
  end: "top top",
  scrub: true,
  onUpdate: (self) => {
    const exitProgress = self.progress;

    gsap.set(heroInner, { y: `${-25 * exitProgress}%` });
  },
});

SplitText.create(".menu-col a", {
  type: "lines, words",
  mask: "words",
  wordsClass: "word",
});

const setMenuState = (nextState) => {
  isMenuOpen = nextState;
  navToggler.classList.toggle("open", isMenuOpen);
  navToggler.setAttribute("aria-expanded", String(isMenuOpen));
  navToggler.setAttribute(
    "aria-label",
    isMenuOpen ? "Fechar menu" : "Abrir menu",
  );
  menuTimeline?.kill();

  if (isMenuOpen) {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    navToggler.classList.add("is-visible");
    lenis.stop();
    menuTimeline = gsap.timeline();
  } else {
    menuTimeline = gsap.timeline({
      onComplete: () => menu.classList.remove("is-open"),
    });
  }

  menuColumns.forEach((column, columnIndex) => {
    const links = column.querySelectorAll("a");

    links.forEach((link, linkIndex) => {
      const words = link.querySelectorAll(".word");
      menuTimeline.to(
        words,
        {
          y: isMenuOpen ? "0%" : "100%",
          opacity: isMenuOpen ? 1 : 0,
          duration: isMenuOpen ? 1 : 0.75,
          ease: "power3.out",
        },
        isMenuOpen ? 0.65 + columnIndex * 0.1 + linkIndex * 0.05 : 0,
      );
    });
  });
};

navToggler.addEventListener("click", () => {
  setMenuState(!isMenuOpen);
});

menuLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setMenuState(false);
  });
});
