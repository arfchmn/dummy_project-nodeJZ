import pool from "../db/dbconnection.js";

export const banner = async (req, res) => {
    try {
        const query = `
        SELECT banner_name, banner_image, description 
        FROM public.information_banner;
        `;
        const result = await pool.query(query);

        if (result.rows.length === 0) {
        return res.status(400).json({
            status: 1,
            message: "Tidak ada data banner yang ditemukan",
            data: [],
        });
        }

        return res.status(200).json({
            status: 0,
            message: "Sukses",
            data: result.rows,
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
            data: null,
        });
    }
};

export const services = async (req, res) => {
  try {
    const query = `
        SELECT service_code, service_name, service_icon, service_tariff 
        FROM public.information_services;
        `;
        const result = await pool.query(query);

        if (result.rows.length === 0) {
        return res.status(400).json({
            status: 1,
            message: "Tidak ada data service yang ditemukan",
            data: [],
        });
        }

        return res.status(200).json({
            status: 0,
            message: "Sukses",
            data: result.rows,
        });

  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
      data: null,
    });
  }
};
