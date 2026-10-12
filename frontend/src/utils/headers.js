import Cookies from 'universal-cookie';

const GetHeaders = () => {
    let cookies = new Cookies();
    const headers = {
        'authorization': `Bearer ${cookies.get('jwt')}`,
    }
    return headers;
}

export default GetHeaders;

