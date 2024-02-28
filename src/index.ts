import axios from 'axios';
import 'dotenv/config';
import fs from 'fs';
import { format } from 'date-fns';

require('dotenv').config()

let shouldFetch = true;

const fetchData = async () => {
    if (!shouldFetch) {
        return;
    }

    await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
            'fields': 'id,name,last_name',
            'access_token': process.env.ACCESS_TOKEN
        }
    })
        .then(res => {
            const today = new Date();
            const timestamp = today.toISOString();
            const logEntry = {
                timestamp,
                data: res.data
            }

            const currentDate = format(today, 'yyy-MM-dd');
            const fileName = `logs/data_${currentDate}.txt`;

            fs.appendFileSync(fileName, JSON.stringify(logEntry) + '\n');

            const appUsage = JSON.parse(res.headers['x-app-usage']);
 
            if (appUsage["total_cputime"] > 100 || appUsage["total_time"] > 100) {
                shouldFetch = false;
                setTimeout(() => {
                    shouldFetch = true;
                }, 60000)
            }

        })
        .catch(err => {
            console.log('Error: ', err.message);
            if (err.response.status == 403) {
                console.log(err.response.status + " Limit reached, retry in 1 minute")
                shouldFetch = false;
                setTimeout(() => {
                    shouldFetch = true;
                }, 60000)
            }
        });

}

setInterval(fetchData, 2000)
