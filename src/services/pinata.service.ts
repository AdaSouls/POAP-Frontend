
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CODE_MASTER = process.env.REACT_APP_API_CODE_MASTER;

export async function getPinataUrl(ipfs: string) {

    let cid = ipfs.replace(/^ipfs?:\/\//i, "");
    console.log("cid is: ", cid);
    
    try {
        const response = await fetch(`${API_BASE_URL}/asset/getPinataImage/${cid}?code=${CODE_MASTER}`, {
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