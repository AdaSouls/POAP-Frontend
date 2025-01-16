
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CODE_MASTER = process.env.REACT_APP_API_CODE_MASTER;

export async function getPinataUrl(ipfs: string) {
    
    try {
        const response = await fetch(`${API_BASE_URL}/asset/getPinataImage/${ipfs}?code=${CODE_MASTER}`, {
            method: 'POST'
        });
        // if (!response.ok) {
        //     const data = await response.json();
        //     return data;
        // }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}