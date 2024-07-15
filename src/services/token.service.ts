const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CODE_MASTER = process.env.REACT_APP_API_CODE_MASTER;


export async function addSoulbound(collectionId: string, payload: any) {
    try {
        const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/soulbounds?code=${CODE_MASTER}`, {
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
        console.error('Error fetching data:', error);
        throw error;
    }
}