import fetch from 'undici-fetch';

interface PeopleInSpace {
    number: number,
    people: {
        name: string,
        biophoto: string,
        biophotowidth: number,
        biophotoheight: number,
        country: string,
        countryflag: string,
        launchdate: Date,
        careerdays: number,
        title: string,
        location: string,
        bio: string,
        biolink: string,
        twitter: string
    }[]
}

export const fetchPeopleInSpace = async (): Promise<PeopleInSpace> => {
    try {
        const res = await fetch('https://www.howmanypeopleareinspacerightnow.com/peopleinspace.json');
        if (res.status !== 200) {
            return Promise.reject('Received non-200 status.');
        }
        const json = await res.json() as PeopleInSpace;
        return json;
    } catch(e) {
        return Promise.reject(e);
    }
}