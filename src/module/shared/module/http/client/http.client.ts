export class HttpClient {
  async get<T>(url: string, options: Record<string, any>): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.log(url);
      const errorMessage = await res.text();
      throw new Error(`Failed to fetch ${errorMessage}`);
    }

    return (await res.json()) as T;
  }
}
