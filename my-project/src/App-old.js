import React, { createContext, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer/Footer";

import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import Productsdetailsh from "./Pages/Productsdetailsh";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Drawer from "@mui/material/Drawer";

import ProductZoom from "./components/ProductZoom";
import ProductDetalisComponent from "./components/ProductDetalis";

import { IoMdClose } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import CartPanel from "./components/CartPanel";



// ✅ CONTEXT
export const MyContext = createContext();

function App() {
  const [openProductDetailsModal, setOpenProductDetailsModal] = useState(false);
  const [openCartpanel, setOpenCartpanel] = useState(false);

  const [maxwidth, setMaxwidth] = useState("md");
  const [fullwidth, setFullwidth] = useState(true);

  // ✅ PRODUCT MODAL OPEN
  const handleClickOpenProductDetailsModal = () => {
    setFullwidth(true);
    setMaxwidth("md");
    setOpenProductDetailsModal(true);
  };

  // ✅ PRODUCT MODAL CLOSE
  const handleCloseProductDetailsModal = () => {
    setOpenProductDetailsModal(false);
  };

  // ✅ CART PANEL TOGGLE (ICON CONNECTED)
  const toggleCartPanel = (newopen) => {
    setOpenCartpanel(newopen);
  };

  return (
    <MyContext.Provider
      value={{
        openProductDetailsModal,
        handleClickOpenProductDetailsModal,
        handleCloseProductDetailsModal,
        toggleCartPanel,       // ✅ ICON USE THIS
        openCartpanel,        // ✅ IF YOU NEED TO CHECK STATUS
      }}
    >
      <BrowserRouter>
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ProductListing" element={<ProductListing />} />
          <Route path="/Productsdetails/:id" element={<Productsdetailsh />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>

        <Footer />

        {/* ✅ PRODUCT DETAILS MODAL */}
        <Dialog
          open={openProductDetailsModal}
          onClose={handleCloseProductDetailsModal}
          fullWidth={fullwidth}
          maxWidth={maxwidth}
          className="productDetailmodal"
        >
          <DialogContent>
            <div className="flex w-full relative">

              {/* ✅ CLOSE BUTTON */}
              <Button
                className="!w-[40px] !h-[40px] !min-w-[40px] !rounded-full !text-[#000] !absolute !right-[10px] !top-[10px]"
                onClick={handleCloseProductDetailsModal}
              >
                <IoMdClose className="text-[30px]" />
              </Button>

              {/* ✅ LEFT */}
              <div className="w-[40%] flex items-center justify-center">
                <ProductZoom />
              </div>

              {/* ✅ RIGHT */}
              <div className="w-[60%] flex items-center justify-center">
                <ProductDetalisComponent />
              </div>

            </div>
          </DialogContent>
        </Dialog>

        {/* ✅ CART PANEL DRAWER */}
        <Drawer
          open={openCartpanel}
          anchor="right"
          onClose={() => toggleCartPanel(false)}
          className="cartpanel"
        >
          {/* ✅ HEADER with FULL BORDER & ICON AT LAST */}
          <div className="flex items-center justify-between p-4 w-[500px] border-b-2 border-gray-300">
            <h4 className="font-semibold text-lg">
              Shopping Cart Panel (1)
            </h4>

            <IoCloseSharp
              className="cursor-pointer text-[30px] absolute right-4 top-4"
              onClick={() => toggleCartPanel(false)}
            />
          </div>



          <CartPanel />


        </Drawer>


      </BrowserRouter>
    </MyContext.Provider>
  );
}

export default App;
