/* Match bundled OSM direction tags without requiring network access during play. */
export function roadDirection(a,b,data)
{
    const key=p=>p.map(n=>n.toFixed(2)).join(',');
    return data?.directions?.[key(a)+'|'+key(b)]||0;
}
