import { config } from 'dotenv';
config();
import fs from 'fs';
import { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { chat } from './openai.mjs';
import { channel } from 'diagnostics_channel';

const supabaseUrl = 'https://rvydqlglkydpzfqhodsl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Read the supabase developers table


async function getDevelopers(type) {
    const { data, error } = await supabase
        .from('developers')
        .select("*")
        .eq('job', type)
        .order("orders", { ascending: true } )
        ;    
        if (error) {
        console.error('Supabase Select Error:', error.message);
    } else {
        console.log('Supabase Select Success:', data);
    }
    // Rank them by the ones with the smallest amount of orders
        console.log(data[0].userid)
        let id = data[0].userid
        return id
}


export { getDevelopers }