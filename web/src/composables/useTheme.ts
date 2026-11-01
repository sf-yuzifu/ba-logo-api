import { computed, ref } from 'vue';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'ba-ui-theme';

const themeMode = ref<ThemeMode>('auto');
const systemIsDark = ref(false);

const resolvedTheme = computed<ResolvedTheme>(() => {
  if (themeMode.value === 'auto') {
    return systemIsDark.value ? 'dark' : 'light';
  }
  return themeMode.value;
});

const applyThemeToDOM = (theme: ResolvedTheme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

let mediaQuery: MediaQueryList | null = null;

const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
  systemIsDark.value = e.matches;
  if (themeMode.value === 'auto') {
    applyThemeToDOM(systemIsDark.value ? 'dark' : 'light');
  }
};

export function useTheme() {
  const initTheme = () => {
    if (typeof window === 'undefined') return;

    // 1. 读取系统深色模式偏好
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemIsDark.value = mediaQuery.matches;

    // 2. 读取本地存储设置（默认为 auto 跟随系统）
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        themeMode.value = saved;
      } else {
        themeMode.value = 'auto';
      }
    } else {
      themeMode.value = 'auto';
    }

    // 3. 初始应用主题
    applyThemeToDOM(resolvedTheme.value);

    // 4. 监听系统主题变化实现自动切换
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    applyThemeToDOM(resolvedTheme.value);
  };

  const cycleTheme = () => {
    if (themeMode.value === 'auto') {
      setThemeMode('light');
    } else if (themeMode.value === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('auto');
    }
  };

  return {
    themeMode,
    resolvedTheme,
    systemIsDark,
    initTheme,
    setThemeMode,
    cycleTheme,
  };
}
