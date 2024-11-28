// routes/payment.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51QPzgsFRwMAZcSARBJDu9s7bKp5sfmQ65XtO11JT9kpuOYKWBTKKWLPoALysfvhvgGBvJXjEJ78x9tmaiLFYNuYP00ZtlQCOdK');
const { authenticateToken } = require('../config/checkAuth');
const User = require('../models/user');
const mongoose = require('mongoose');

// routes/payment.js (backend)
router.post('/create-payment', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (user.plan === 'pro') {
            return res.status(400).json({ error: 'Usuario ya tiene plan Pro' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'TaskMaster Pro',
                        description: 'Plan Pro'
                    },
                    unit_amount: 990,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'http://localhost:3000/api/payment/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/dashboard',
            metadata: {
                userId: userId
            }
        });

        res.json({ 
            url: session.url,
            sessionId: session.id
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Nuevo endpoint de éxito
router.get('/payment/success', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
        
        if (session.payment_status === 'paid') {
            await User.findByIdAndUpdate(
                session.metadata.userId,
                { plan: 'pro' },
                { new: true }
            );
        }
        
        res.redirect('/dashboard?upgrade=success');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/dashboard?upgrade=error');
    }
});

module.exports = router;