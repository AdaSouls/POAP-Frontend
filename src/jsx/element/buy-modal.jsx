import React from 'react';


const BuyModal = () => {
    return (
        <>
            <div class="table-responsive">
                <table class="table">
                    <tbody>
                        <tr>
                            <td><span class="text-primary">Buyer Email</span></td>
                            <td><span class="text-primary">buyer@example.com</span></td>
                        </tr>
                        <tr>
                            <td><span class="text-primary">Seller Email</span></td>
                            <td><span class="text-primary">seller@example.com</span></td>
                        </tr>
                        <tr>
                            <td>Exchange Rate</td>
                            <td>0.00212455 BTC</td>
                        </tr>
                        <tr>
                            <td>Fee</td>
                            <td>$28.00 USD</td>
                        </tr>
                        <tr>
                            <td>Total</td>
                            <td>$854.00 USD</td>
                        </tr>
                        <tr>
                            <td>Vat</td>
                            <td>
                                <div class="text-danger">$25.00 USD</div>
                            </td>
                        </tr>
                        <tr>
                            <td> Sub Total</td>
                            <td> $1232.00 USD</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </>
    );
};

export default BuyModal;