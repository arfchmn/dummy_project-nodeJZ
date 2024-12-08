import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/dbconnection.js';
import validator from 'validator';
import fs from 'fs';


export const register = async (req, res) => {
    try {
        let { email, first_name, last_name, password } = req.body;
        if (!first_name) {
            return res.status(400).json({
                status: 102,
                message: 'Parameter first_name harus di isi',
                data: null,
            });
        }
        if (!last_name) {
            return res.status(400).json({
                status: 102,
                message: 'Parameter last_name harus di isi',
                data: null,
            });
        }
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                status: 102,
                message: 'Paramter email tidak sesuai format',
                data: null,
            });
        }
        if (!password || !validator.isLength(password, { min: 8 })) {
            return res.status(400).json({
                status: 102,
                message: 'Password length minimal 8 karakter',
                data: null,
            });
        }

        const queryCheckEmail = `SELECT*FROM public.membership WHERE email = $1` 
        const resQueryVerif = await pool.query(queryCheckEmail, [email]);
        if(resQueryVerif.rows.length > 0){
            return res.status(400).json({
                "status": 102,
                "message": "Email sudah terdaftar",
                "data": null
            })
        }

        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        const query = `
        INSERT INTO public.membership (email, first_name, last_name, password) 
        VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [email, first_name, last_name, password];
        const resQuery = await pool.query(query, values);
        res.status(200).json({
            status: 0,
            message: "Registrasi berhasil silahkan login",
            data: null,
        });
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

export const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                status: 102,
                message: 'Paramter email tidak sesuai format',
                data: null,
            });
        }
        
        if (!password || !validator.isLength(password, { min: 8 })) {
            return res.status(400).json({
                status: 102,
                message: 'Password length minimal 8 karakter',
                data: null,
            });
        }
        const query = `SELECT * FROM public.membership WHERE email = $1`;
        const values = [email];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
          return res.status(401).json({
            status: 103,
            message: 'Username atau password salah',
            data: null,
          });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
              status: 103,
              message: 'Username atau password salah',
              data: null,
            });
        }
        const accessToken = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "12h"});
        return res.status(200).json({
            "status": 0,
            "message": "Login Sukses",
            "data": {
                "token": accessToken
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

export const profile = async (req, res) => {
    try {
        const email = req.user
        const query = `
        SELECT email, first_name, last_name, profile_image 
        FROM public.membership WHERE email = $1;
        `;
        const result = await pool.query(query,[email]);

        if (result.rows.length === 0) {
        return res.status(400).json({
            status: 1,
            message: "Tidak ada data profile yang ditemukan",
            data: null,
        });
        }

        return res.status(200).json({
            status: 0,
            message: "Sukses",
            data: result.rows[0],
        });
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {first_name,last_name} = req.body
        if(!first_name){
            return res.status(400).json({
                status: 102,
                message: "Parameter first_name harus di isi",
                data: null
            })
        }else if(!last_name){
            return res.status(400).json({
                status: 102,
                message: "Parameter last_name harus di isi",
                data: null
            })
        } 
            
        const email = req.user
        const query = `
        UPDATE public.membership set first_name = $1 ,last_name =$2
        WHERE email = $3
        RETURNING email, first_name, last_name, profile_image
        `;
        const result = await pool.query(query,[first_name,last_name,email]);

        if (result.rows.length === 0) {
        return res.status(400).json({
            status: 1,
            message: "Tidak ada data profile yang ditemukan",
            data: null,
        });
        }

        return res.status(200).json({
            status: 0,
            message: "Update Pofile berhasil",
            data: result.rows[0],
        });
    } catch (error) {
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}

export const updateProfileImage = async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).json({
                status: 102,
                message: "Field file tidak boleh kosong",
                data: null,
            });
        }

        const email = req.user;
        const allowedExtensions = [".jpeg", ".jpg", ".png"];
        const fileExtension = `.${req.file.mimetype.split("/")[1]}`;
        if (!allowedExtensions.includes(fileExtension)) {
            fs.unlinkSync(req.file.path); // Hapus file jika format tidak sesuai
            return res.status(400).json({
                status: 102,
                message: "Format Image tidak sesuai",
                data: null,
            });
        }

        const filePath = `member_photo/${req.file.filename}`;
        const apiURL = `${process.env.API_URL}/${filePath}`;

        const updateQuery = `
        UPDATE public.membership
        SET profile_image = $1
        WHERE email = $2
        RETURNING email, first_name, last_name, profile_image
        `;
        const result = await pool.query(updateQuery, [apiURL, email]);

        if (result.rows.length === 0) {
            fs.unlinkSync(req.file.path); // Hapus file jika user tidak ditemukan
            return res.status(400).json({
                status: 102,
                message: "User not found",
                data: null,
            });
        }

        return res.status(200).json({
            status: 0,
            message: "Update Profile Image berhasil",
            data: result.rows[0],
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            "status": 500,
            "message": error.message,
            "data": null
        })
    }
}
