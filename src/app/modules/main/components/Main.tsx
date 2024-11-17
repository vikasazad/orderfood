import React from "react";
import Header from "../../header/components/header";
import { getRestaurantData } from "../utils/mainRestaurantApi";
import Category from "./category";
import ItemCard from "./itemCard";
import Footer from "../../footer/components/footer";

const Main = async () => {
  const data: any = await getRestaurantData();

  return (
    <div className="relative">
      <Header data={data.info} />
      <Category data={data.menu.categories} />
      <ItemCard data={data.menu.categories} />
      <Footer data={data.menu.categories} />
    </div>
  );
};

export default Main;
