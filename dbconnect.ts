import mysql from "mysql";
import util from "util";

export const conn = mysql.createPool(
    {
        connectionLimit: 10,
        host: "191.101.230.103",
        user: "u528477660_shutter",
        password: "Oh#2DbQa",
        database: "u528477660_shutter",
    }
);


export const queryAsync = util.promisify(conn.query).bind(conn);