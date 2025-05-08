-- Function to get tax summary data
CREATE OR REPLACE FUNCTION get_tax_summary(tax_year INTEGER, vendor_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    vendor_name TEXT,
    total_amount DECIMAL(10, 2),
    payment_count INTEGER,
    tax_forms_generated INTEGER,
    tax_id TEXT,
    tax_country TEXT,
    is_company BOOLEAN,
    paypal_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vp.vendor_name,
        SUM(vp.amount) AS total_amount,
        COUNT(vp.id) AS payment_count,
        COUNT(CASE WHEN vp.tax_form_generated THEN 1 END) AS tax_forms_generated,
        v.tax_id,
        v.tax_country,
        v.is_company,
        v.paypal_email
    FROM 
        vendor_payouts vp
    JOIN 
        vendors v ON vp.vendor_name = v.vendor_name
    WHERE 
        vp.tax_year = tax_year
        AND vp.status = 'completed'
        AND (vendor_filter IS NULL OR vp.vendor_name = vendor_filter)
    GROUP BY 
        vp.vendor_name, v.tax_id, v.tax_country, v.is_company, v.paypal_email
    ORDER BY 
        total_amount DESC;
END;
$$ LANGUAGE plpgsql;
