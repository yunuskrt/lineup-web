import React from 'react';
import HomeArchive from '@/components/home/HomeArchive';
import HomeFold from '@/components/home/HomeFold';
import HomeInside from '@/components/home/HomeInside';
import HomeModes from '@/components/home/HomeModes';
import HomeRules from '@/components/home/HomeRules';

type Props = {};

const Home = ({}: Props) => {
  return (
    <>
      <HomeFold />
      <HomeArchive />
      <HomeRules />
      <HomeModes />
      <HomeInside />
    </>
  );
};

export default Home;
