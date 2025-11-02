import { db } from "../src/resources/db/db";
import { token } from "../src/resources/db/schema";
import { supabase } from "../src/resources/db/supabase";

async function testSupabaseClientInteraction() {
    console.log("testing db with supabase-js");

    try {
        const { data, error } = await supabase
            .from('token')
            .select('*')
            .limit(5);

        if (error) {
            console.log("Query failed:", error.message);
        } else {
            console.log("Query successful! Found", data?.length || 0, "records");
            if (data && data.length > 0) {
                console.log("Sample record:", data[0]);
            }
        }
    } catch (err) {
        console.log("Connection error:", err instanceof Error ? err.message : String(err));
    }
}

async function testDbInteraction() {
    console.log("TESTING DB CONNECTION")
    const tokens = await db.select().from(token);
    console.log(tokens);
}

if (require.main === module) {
    testDbInteraction();
}