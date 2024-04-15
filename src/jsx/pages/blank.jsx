import React from 'react';
import { Link } from 'react-router-dom';

import Header from '../layout/header'
import Sidebar from '../layout/sidebar';

const Blank = () => {
    return (
        <>
            <Header />
            <Sidebar />
            <h1>Blank</h1>
        </>
    );
};

export default Blank;