import pool from "../db/dbconnection.js";
import validator from "validator";

export const balance = async (req, res) => {
    try {
        const email = req.user
        const query = `
        SELECT balance
        FROM public.membership WHERE email = $1;
        `;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
        return res.status(400).json({
            status: 400,
            message: "Membership tidak ada yang ditemukan",
            data: null,
        });
        }

        return res.status(200).json({
            status: 0,
            message: "Get Balance Berhasil",
            data: {
                balance: result.rows[0].balance
            }
        });
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

export const topup = async (req, res) => {
    const { top_up_amount } = req.body;
    if (!top_up_amount || !validator.isInt(top_up_amount.toString(), { min: 1 })) {
        return res.status(400).json({
            status: 102,
            message: "Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0",
            data: null,
        });
    }

    try {
        const email = req.user;
        await pool.query("BEGIN");
        const updateBalanceQuery = `
        UPDATE membership
        SET balance = balance + $1
        WHERE email = $2
        RETURNING balance;
        `;
        const updatedUser = await pool.query(updateBalanceQuery, [top_up_amount, email]);
        if (updatedUser.rowCount === 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
            status: 400,
            message: "User tidak ditemukan",
            data: null,
        });
        }

        const newBalance = updatedUser.rows[0].balance;

        const datePart = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
        const transactionCountQuery = `SELECT COUNT(*) FROM transaction WHERE created_on::date = CURRENT_DATE`;
        const transactionCount = await pool.query(transactionCountQuery);
        const transactionNumber = parseInt(transactionCount.rows[0].count) + 1;
        const invoiceNumber = `INV${datePart}-${transactionNumber.toString().padStart(3, "0")}`;

        const insertTransactionQuery = `
        INSERT INTO transaction (invoice_number, transaction_type, description, total_amount, email)
        VALUES ($1, $2, $3, $4, $5);
        `;
        await pool.query(insertTransactionQuery, [
            invoiceNumber,
            "TOPUP",
            `TOP UP Balance sebesar ${top_up_amount}`,
            top_up_amount,
            email,
        ]);

        await pool.query("COMMIT");

        return res.status(200).json({
            status: 0,
            message: "Top Up Balance berhasil",
            data: {
                balance: newBalance,
            },
        });
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

export const transaction = async (req, res) => {
    try {
        const email = req.user;

        const { service_code } = req.body;

        if (!service_code) {
        return res.status(400).json({
            status: 102,
            message: "Service ataus Layanan tidak ditemukan",
            data: null,
        });
        }

        const serviceQuery = `
        SELECT service_tariff, service_name 
        FROM public.information_services 
        WHERE service_code = $1
        `;
        const serviceResult = await pool.query(serviceQuery, [service_code]);

        if (serviceResult.rows.length === 0) {
        return res.status(404).json({
            status: 102,
            message: "Service ataus Layanan tidak ditemukan",
            data: null,
        });
        }

        const serviceTariff = serviceResult.rows[0].service_tariff;
        const serviceName = serviceResult.rows[0].service_name;

        const userQuery = `
        SELECT balance 
        FROM public.membership 
        WHERE email = $1
        `;
        const userResult = await pool.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
        return res.status(400).json({
            status: 102,
            message: "User not found",
            data: null,
        });
        }

        const userBalance = userResult.rows[0].balance;

        if (userBalance < serviceTariff) {
        return res.status(400).json({
            status: 102,
            message: "Saldo tidak mencukupi",
            data: null,
        });
        }

        const newBalance = userBalance - serviceTariff;
        const updateBalanceQuery = `
        UPDATE public.membership
        SET balance = $1
        WHERE email = $2
        `;
        await pool.query(updateBalanceQuery, [newBalance, email]);

        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const countQuery = `
        SELECT COUNT(*) AS count 
        FROM public.transaction 
        WHERE created_on::date = CURRENT_DATE
        `;
        const countResult = await pool.query(countQuery);
        const transactionCount = parseInt(countResult.rows[0].count, 10) + 1;
        const invoiceNumber = `INV${datePart}-${transactionCount.toString().padStart(3, "0")}`;

        const insertTransactionQuery = `
        INSERT INTO public.transaction (
            invoice_number, transaction_type, description, total_amount, email
        )
        VALUES ($1, 'PAYMENT', $2, $3, $4)
        RETURNING invoice_number, transaction_type, total_amount, created_on
        `;
        const description = `Payment - ${service_code}`;
        const transactionResult = await pool.query(insertTransactionQuery, [
            invoiceNumber,
            description,
            serviceTariff,
            email,
        ]);

        return res.status(200).json({
            status: 0,
            message: "Transaction successful",
            data: {
                invoice_number: transactionResult.rows[0].invoice_number,
                service_code: service_code,
                service_name: serviceName, 
                transaction_type: "PAYMENT",
                total_amount: transactionResult.rows[0].total_amount,
                created_on: transactionResult.rows[0].created_on,
            }
        });
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

export const transactHistory = async (req, res) => {
    try {
        let{limit,offset} = req.body

        if (!limit || limit === null || !validator.isInt(String(limit), { min: 0 })) {
            limit = 0;
        }

        if (!offset || offset === null || !validator.isInt(String(offset), { min: 0 })) {
            offset = 0;
        }
        const email = req.user;
        let userQuery;
        let userResult;
        if(limit === 0){
            userQuery = `
            SELECT invoice_number, transaction_type, description, total_amount, created_on 
            FROM public.transaction 
            WHERE email = $1
            ORDER BY created_on DESC
            `;
            userResult = await pool.query(userQuery, [email]);
        }else{
            userQuery = `
            SELECT invoice_number, transaction_type, description, total_amount, created_on 
            FROM public.transaction 
            WHERE email = $1
            ORDER BY created_on DESC LIMIT $2
            `;
            userResult = await pool.query(userQuery, [email,limit]);
        }
        
        return res.status(200).json({
            "status": 0,
            "message": "Get History Berhasil",
            "data": {
                offset: offset,
                limit: limit,
                records: userResult.rows
            }
        })
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

