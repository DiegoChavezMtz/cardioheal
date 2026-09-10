// Wrapper silencioso sobre localStorage, portado de LS() en el consola.html
// original: en SSR o con storage bloqueado simplemente no persiste, sin
// tronar el render.
export function leerLS(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

export function escribirLS(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // almacenamiento no disponible: se ignora
  }
}
