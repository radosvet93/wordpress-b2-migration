export async function fetchAllPages(url) {
  let page = 1;
  let results = [];

  while (true) {
    const res = await fetch(`${url}&page=${page}`);
    if (!res.ok) break;

    const data = await res.json();
    results.push(...data);

    const totalPages = Number(res.headers.get("X-WP-TotalPages"));
    if (page >= totalPages) break;

    page++;
  }

  return results;
}
