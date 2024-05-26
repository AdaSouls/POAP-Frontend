const key = "COLLECTIONS";

export async function getAll(owner: string) {
    const collections: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    return collections.filter(c => c.owner == owner);
}

export async function get(id: string, owner?: string) {
    const collections: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    return collections.find(c => c.id == id && (!owner || c.owner == owner));
}

export async function insert(payload: any) {
    const collections: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    const collection = { id: collections.length, ...payload };
    collections.push(collection);
    localStorage.setItem(key, JSON.stringify(collections));
    return collection;
}

export async function update(id: string, data: any) {
    const collection = await get(id);
    if (collection) {
        const collections = (await getAll(collection.owner)).map(c => c.id != id ? c : ({ ...collection, ...data }))
        localStorage.setItem(key, JSON.stringify(collections));
    }
}

export async function updateToken(id: string, tokenId: string, data: any) {
    const collection = await get(id);
    if (collection) {
        const index = collection.tokens.findIndex((t: any) => t.id == tokenId);
        collection.tokens[index] = {
            ...collection.tokens[index],
            ...data
        }
        const collections = (await getAll(collection.owner)).map(c => c.id != id ? c : collection);
        localStorage.setItem(key, JSON.stringify(collections));
    }
}

export async function remove(id: string) {
    const collection = await get(id);
    if (collection) {
        const collections = (await getAll(collection.owner)).filter(c => c.id != id)
        localStorage.setItem(key, JSON.stringify(collections));
    }
}

export async function getClaimableTokens(beneficiary: string) {
    const collections: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    return collections.flatMap(c => 
        c.tokens.some((t: any) => t.beneficiary == beneficiary) 
        ? c.tokens.filter((t: any) => !t.burnTx && !t.claimUtxo).map((t:any) => ({...t, collection: c})) 
        : []
    );
}