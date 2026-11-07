export const themeStorageKey = "aia-theme";

// Runs synchronously in the document head, before the first paint. Only this
// allowlisted data attribute differs from the server's theme-neutral HTML.
export const themeInitialization = `(()=>{let t;try{t=localStorage.getItem('${themeStorageKey}')}catch{}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})()`;
