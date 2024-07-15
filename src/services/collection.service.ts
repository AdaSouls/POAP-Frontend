const key = "COLLECTIONS";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CODE_MASTER = process.env.REACT_APP_API_CODE_MASTER;

export async function getAll(owner: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${owner}/collections?code=${CODE_MASTER}`);
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

export async function getAllInvited(owner: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${owner}/collections/invited?code=${CODE_MASTER}`);
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

export async function get(id: string, owner?: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/collections/${id}?code=${CODE_MASTER}`);
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
    // const collections: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    // return collections.find(c => c.id == id && (!owner || c.owner == owner));
}

export async function insert(owner: string, payload: any) {
    try {
        const response = await fetch(`${API_BASE_URL}/collections/${owner}?code=${CODE_MASTER}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error inserting data:', error);
        throw error;
    }
}

export async function sign(collenctionId: string, owner: string, signature: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/collections/${collenctionId}/user/${owner}/sign?code=${CODE_MASTER}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({signature}),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error inserting data:', error);
        throw error;
    }
}

export async function updateToken(id: string, tokenId: string, data: any) {
    const collection = await get(id);
    console.log(collection.tokens);
    
    if (!collection) {
        console.error('Error updating collection:', id);
        throw new Error(`Error updating collection: ${id}`);
    }
    const index = collection.tokens.findIndex((t: any) => t.id == tokenId);
    collection.tokens[index] = {
        ...collection.tokens[index],
        ...data
    }
    const collections = (await getAll(collection.owner)).map(c => c.id != id ? c : collection);
    localStorage.setItem(key, JSON.stringify(collections));
    return collection.tokens[index];
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
            ? c.tokens.filter((t: any) => !t.burnTx && !t.claimUtxo).map((t: any) => ({ ...t, collection: c }))
            : []
    );
}