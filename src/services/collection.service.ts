const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function getAll(owner: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${owner}/collections`);
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
        const response = await fetch(`${API_BASE_URL}/users/${owner}/collections/invited`);
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
        const response = await fetch(`${API_BASE_URL}/collections/${id}`);
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

export async function insert(owner: string, payload: any) {
    console.log("this is the paylooad: ", payload);
    try {
        const response = await fetch(`${API_BASE_URL}/collections/${owner}`, {
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
        const response = await fetch(`${API_BASE_URL}/collections/${collenctionId}/user/${owner}/sign`, {
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

export async function updateToken(collectionId: string, tokenId: string, payload: any) {
    try {
        const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/soulbounds/${tokenId}`, {
            method: 'PATCH',
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


export async function getClaimableTokens(userId: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/soulbounds/claimable`);
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
