const key = "COLLECTIONS";

export async function getAll() {
    const collections: any[] = JSON.parse(sessionStorage.getItem(key) || '[]');
    return collections;
}

export async function get(id: string) {
    const collections: any[] = JSON.parse(sessionStorage.getItem(key) || '[]');
    return collections.find(c => c.id == id);
}

export async function insert(payload: any) {
    const collections: any[] = JSON.parse(sessionStorage.getItem(key) || '[]');
    collections.push({ id: collections.length, ...payload });
    sessionStorage.setItem(key, JSON.stringify(collections));
}

export async function update(id: string, data: any) {
    const collection = await get(id);
    if (collection) {
        const collections = (await getAll()).map(c => c.id != id ? c : ({ ...collection, ...data }))
        sessionStorage.setItem(key, JSON.stringify(collections));
    }
}

export async function remove(id: string) {
    const collection = await get(id);
    if (collection) {
        const collections = (await getAll()).filter(c => c.id != id)
        sessionStorage.setItem(key, JSON.stringify(collections));
    }
}