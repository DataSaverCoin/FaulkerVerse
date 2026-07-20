/*
========================================================

FaulkerVerse Engine

File:
    Wallet.js

Purpose:
    Owns the player's current spendable balance.

========================================================
*/

"use strict";

export class Wallet
{
    constructor(startingBalance = 0)
    {
        this.balance = startingBalance;
        this.listeners = new Set();
    }

    deposit(amount)
    {
        const payment =
            Math.max(0, Math.round(amount));

        this.balance += payment;
        this.notify(payment);

        return this.balance;
    }

    subscribe(listener)
    {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    notify(amount)
    {
        for (const listener of this.listeners)
        {
            listener(this.balance, amount);
        }
    }
}
