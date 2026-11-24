-- =========================================================================
-- K-LIST: SUPABASE POSTGRESQL SCHEMA & SEED DATA
-- Run this in your Supabase SQL Editor to populate your entire backend database
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS drama_actors CASCADE;
DROP TABLE IF EXISTS drama_genres CASCADE;
DROP TABLE IF EXISTS actors CASCADE;
DROP TABLE IF EXISTS dramas CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Genres
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Dramas
CREATE TABLE dramas (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  description TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actors
CREATE TABLE actors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  birth_year INTEGER,
  gender TEXT CHECK (gender IN ('Pria', 'Wanita')),
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drama - Genre Relation
CREATE TABLE drama_genres (
  id SERIAL PRIMARY KEY,
  drama_id INTEGER REFERENCES dramas(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  UNIQUE(drama_id, genre_id)
);

-- Drama - Actor Relation
CREATE TABLE drama_actors (
  id SERIAL PRIMARY KEY,
  drama_id INTEGER REFERENCES dramas(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES actors(id) ON DELETE CASCADE,
  character_name TEXT,
  is_lead BOOLEAN DEFAULT true,
  UNIQUE(drama_id, actor_id)
);

-- Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  drama_id INTEGER REFERENCES dramas(id) ON DELETE CASCADE,
  user_id UUID,
  username TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  drama_id INTEGER REFERENCES dramas(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, drama_id)
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE dramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE drama_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE drama_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for genres" ON genres FOR SELECT USING (true);
CREATE POLICY "Allow public read for dramas" ON dramas FOR SELECT USING (true);
CREATE POLICY "Allow public read for actors" ON actors FOR SELECT USING (true);
CREATE POLICY "Allow public read for drama_genres" ON drama_genres FOR SELECT USING (true);
CREATE POLICY "Allow public read for drama_actors" ON drama_actors FOR SELECT USING (true);
CREATE POLICY "Allow public read for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert for reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read watchlist" ON watchlist FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage watchlist" ON watchlist FOR ALL USING (true);
CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);

-- 4. INSERT GENRES
INSERT INTO genres (id, name) VALUES
(1, 'Romance'),
(2, 'Comedy'),
(3, 'Action'),
(4, 'Thriller'),
(5, 'Mystery'),
(6, 'Crime'),
(7, 'Fantasy'),
(8, 'Historical'),
(9, 'Medical'),
(10, 'Legal'),
(11, 'School'),
(12, 'Horror'),
(13, 'Youth'),
(14, 'Drama')
ON CONFLICT (id) DO NOTHING;

-- 5. INSERT ACTORS (Matched with assets/img/actors)
INSERT INTO actors (id, name, birth_year, gender, photo_url, bio) VALUES
(1, 'Bae Suzy', 1994, 'Wanita', 'assets/img/actors/bae-suzy.jpg', 'Nation''s first love, celebrated actress and singer starring in Start-Up, Vagabond, and Doona!.'),
(2, 'Go Youn-jung', 1996, 'Wanita', 'assets/img/actors/go-youn-jung.jpg', 'Critically acclaimed actress recognized for Alchemy of Souls, Moving, Sweet Home, and Resident Playbook.'),
(3, 'Gong Yoo', 1979, 'Pria', 'assets/img/actors/gong-yoo.png', 'Iconic global star famed for Goblin, Train to Busan, Coffee Prince, and Squid Game.'),
(4, 'Han So-hee', 1994, 'Wanita', 'assets/img/actors/Han-So-Hee.jpeg', 'Dynamic actress celebrated for The World of the Married, Nevertheless, My Name, and Gyeongseong Creature.'),
(5, 'Hyun Bin', 1982, 'Pria', 'assets/img/actors/hyun-bin.jpg', 'Legendary Hallyu leading actor renowned for Crash Landing on You, Secret Garden, and Memories of the Alhambra.'),
(6, 'Ji Chang-wook', 1987, 'Pria', 'assets/img/actors/ji-chang-wook.png', 'Electrifying action and romance powerhouse star of Welcome to Samdal-ri, Healer, and The K2.'),
(7, 'Kim Da-mi', 1995, 'Wanita', 'assets/img/actors/kim-da-mi.jpg', 'Sensational talent acclaimed for Itaewon Class, Our Beloved Summer, and The Witch.'),
(8, 'Kim Ji-won', 1992, 'Wanita', 'assets/img/actors/kim-ji-won.jpg', 'Beloved top actress famed for Queen of Tears, Descendants of the Sun, and Fight for My Way.'),
(9, 'Kim Seon-ho', 1986, 'Pria', 'assets/img/actors/kim-seon-ho.jpg', 'Charming leading actor of Hometown Cha-Cha-Cha, Start-Up, and The Childe.'),
(10, 'Kim Soo-hyun', 1988, 'Pria', 'assets/img/actors/kim-soo-hyun.jpg', 'One of Korea''s highest-paid top actors, celebrated for Queen of Tears, It''s Okay to Not Be Okay, and My Love from the Star.'),
(11, 'Lee Jong-suk', 1989, 'Pria', 'assets/img/actors/lee-jong-suk.jpg', 'Award-winning leading man of Big Mouth, W: Two Worlds, and While You Were Sleeping.'),
(12, 'Lee Jun-ho', 1990, 'Pria', 'assets/img/actors/lee-jun-ho.jpeg', 'Baeksang Best Actor recipient and 2PM member known for King the Land and The Red Sleeve.'),
(13, 'Lee Min-ho', 1987, 'Pria', 'assets/img/actors/lee-min-ho.jpeg', 'Global Hallyu megastar recognized for The King: Eternal Monarch, Boys Over Flowers, and Pachinko.'),
(14, 'Park Min-young', 1986, 'Wanita', 'assets/img/actors/park-min-young.jpg', 'Rom-com royalty known for What''s Wrong with Secretary Kim, Marry My Husband, and Healer.'),
(15, 'Park Seo-joon', 1988, 'Pria', 'assets/img/actors/park-seo-joon.jpeg', 'Prolific international icon starring in Itaewon Class, What''s Wrong with Secretary Kim, and Gyeongseong Creature.'),
(16, 'Park Shin-hye', 1990, 'Wanita', 'assets/img/actors/park-shin-hye.jpg', 'Esteemed versatile actress famous for The Judge from Hell, Doctor Slump, Pinocchio, and The Heirs.'),
(17, 'Shin Min-a', 1984, 'Wanita', 'assets/img/actors/sin-min-ah.jpg', 'Beloved veteran actress leading Hometown Cha-Cha-Cha, Oh My Venus, and Karma.'),
(18, 'Song Joong-ki', 1985, 'Pria', 'assets/img/actors/song-joong-ki.jpg', 'Top actor renowned for Vincenzo, Descendants of the Sun, and Reborn Rich.'),
(19, 'Song Kang', 1994, 'Pria', 'assets/img/actors/songkang.jpeg', 'Global favorite nicknamed Son of Netflix, starring in Sweet Home, Nevertheless, and My Demon.'),
(20, 'IU (Lee Ji-eun)', 1993, 'Wanita', 'assets/img/actors/UI.jpg', 'Legendary solo artist and acclaimed actress known for Hotel Del Luna, My Mister, and When Life Gives You Tangerines.'),
(21, 'Wi Ha-joon', 1991, 'Pria', 'assets/img/actors/wi-ha-joon.jpg', 'Charismatic action star recognized globally in Squid Game, Bad and Crazy, and Gyeongseong Creature.')
ON CONFLICT (id) DO NOTHING;

-- 6. INSERT DRAMAS (Matched with assets/img/poster)
INSERT INTO dramas (id, title, year, description, poster_url, trailer_url) VALUES
(1, 'Bon Appétit, Your Majesty', 2025, 'Lita, a cheerful modern chef, suddenly finds herself in a royal palace and becomes the personal chef for Emperor Raynard.', 'assets/img/poster/bon appetit.jpg', 'https://www.youtube.com/results?search_query=Bon+Appetit+Your+Majesty+kdrama+trailer'),
(2, 'Vincenzo', 2021, 'An Italian-Korean lawyer working for the mafia returns to Seoul to seek revenge, but his mission becomes even more dangerous when he gets entangled with a corrupt law firm.', 'assets/img/poster/Vincenzo.jpg', 'https://www.youtube.com/watch?v=_J8tYxSB_LQ'),
(3, 'Crash Landing on You', 2019, 'A wealthy chaebol heiress accidentally crash-lands in North Korea and unexpectedly falls in love with an army captain who risks everything to protect her.', 'assets/img/poster/cloy.jpg', 'https://www.youtube.com/watch?v=eXMjTXL2Vks'),
(4, 'Twenty-Five Twenty-One', 2022, 'In a time when dreams seem out of reach, a teen fencer pursues big ambitions and meets a hardworking young man who seeks to rebuild his life.', 'assets/img/poster/2521.jpg', 'https://www.youtube.com/watch?v=gYp4cKuT-2U'),
(5, 'Alchemy of Souls', 2022, 'A powerful sorceress in a blind woman''s body encounters a man from a prestigious family who wants her help to change his destiny.', 'assets/img/poster/aos.jpg', 'https://www.youtube.com/watch?v=H7447U6k-0Y'),
(6, 'All of Us Are Dead', 2022, 'A high school becomes ground zero for a zombie virus outbreak. Trapped students must fight their way out or turn into one of the infected.', 'assets/img/poster/aouad.jpg', 'https://www.youtube.com/watch?v=IN5TD4VRcZU'),
(7, 'Castaway Diva', 2023, 'Fifteen years after being stranded on a deserted island, an aspiring singer returns to society, undeterred by new challenges in pursuing her dream.', 'assets/img/poster/ctlbt.jpg', 'https://www.youtube.com/watch?v=kYJ5oG9r_Vw'),
(8, 'Doctor Slump', 2024, 'Two brilliant doctors who used to be rivals in high school reunite at the lowest point in their lives, finding comfort and romance in each other.', 'assets/img/poster/doctor-slump.jpg', 'https://www.youtube.com/watch?v=34aN8k8_J1s'),
(9, 'Daily Dose of Sunshine', 2023, 'A determined young nurse navigates the complex world of mental healthcare and the diverse lives of patients in a psychiatric ward.', 'assets/img/poster/dotf.jpg', 'https://www.youtube.com/watch?v=hZ7W9fO6t9k'),
(10, 'Extraordinary Attorney Woo', 2022, 'Brilliant attorney Woo Young-woo tackles challenges in the courtroom and beyond as a rookie at a top law firm and a woman on the autism spectrum.', 'assets/img/poster/eaw.jpg', 'https://www.youtube.com/watch?v=9SdYFYflFbw'),
(11, 'Guardian: The Lonely and Great God (Goblin)', 2016, 'An immortal goblin searches for his human bride to end his cursed eternal life, only to find himself falling deeply in love with her.', 'assets/img/poster/goblin.jpg', 'https://www.youtube.com/watch?v=8AcNG_w9aXw'),
(12, 'Good Boy', 2025, 'Olympic medalists become special police officers to combat violent crime and injustice using their unique athletic skills.', 'assets/img/poster/good-boy.jpg', 'https://www.youtube.com/results?search_query=Good+Boy+kdrama+trailer'),
(13, 'Gyeongseong Creature', 2023, 'In spring 1945 Gyeongseong during Japanese rule, an entrepreneur and a sleuth battle for survival against a monstrous creature born of human greed.', 'assets/img/poster/gyeongseong-creature.jpg', 'https://www.youtube.com/watch?v=2N7t_g_Pz_s'),
(14, 'Hospital Playlist', 2020, 'Five doctors who have been friends since medical school share a love for music while saving lives together at Yulje Medical Center.', 'assets/img/poster/hospital-playlist.jpg', 'https://www.youtube.com/watch?v=N_8Vf_Xw0qA'),
(15, 'Hometown Cha-Cha-Cha', 2021, 'A big-city dentist opens a practice in a close-knit seaside village, home to a charming jack-of-all-trades who is her polar opposite.', 'assets/img/poster/htccc.jpg', 'https://www.youtube.com/watch?v=wXbJk9s0a4A'),
(16, 'It''s Okay to Not Be Okay', 2020, 'An antisocial children''s book author and a selfless psychiatric ward caretaker heal each other''s emotional and psychological wounds.', 'assets/img/poster/iotnbo.jpeg', 'https://www.youtube.com/watch?v=50ek4HQo0yc'),
(17, 'Itaewon Class', 2020, 'An ex-con and his ambitious crew fight to turn their ambitious street bar into a massive food franchise while getting revenge on a corrupt conglomerate.', 'assets/img/poster/itaewon-class.jpg', 'https://www.youtube.com/watch?v=NeaHNQJ1kKA'),
(18, 'Karma', 2025, 'Six individuals intertwined in an inescapable, ill-fated web of karma struggle to break free from their dark pasts and tragic destinies.', 'assets/img/poster/karma.jpg', 'https://www.youtube.com/results?search_query=Karma+kdrama+netflix+trailer'),
(19, 'Love Next Door', 2024, 'A successful architect reunites with his childhood friend when she returns to Korea to reset her life, rekindling feelings they tried to forget.', 'assets/img/poster/love-next-door.jpg', 'https://www.youtube.com/watch?v=t_o7aJk8q_M'),
(20, 'Lovely Runner', 2024, 'A devoted fan travels back in time to 2008 to save her favorite top star from a tragic fate, rewriting their destiny together.', 'assets/img/poster/lovely-runner.png', 'https://www.youtube.com/watch?v=wN4Nl_JqW9A'),
(21, 'My Demon', 2023, 'A pitiless 200-year-old demon temporarily loses his powers after getting entangled with a haughty, workaholic heiress, leading to a contract marriage.', 'assets/img/poster/mfn.jpg', 'https://www.youtube.com/watch?v=F0Z7dE1Tq0E'),
(22, 'Nevertheless', 2021, 'The intoxicating charm of a flirtatious art school classmate pulls a heartbroken woman into a friends-with-benefits relationship despite her misgivings.', 'assets/img/poster/nevertheless.jpg', 'https://www.youtube.com/watch?v=5rK3O1O_wJ8'),
(23, 'Oh My Venus', 2015, 'A stressed lawyer teams up with a world-renowned personal trainer to regain her health and confidence, discovering love along the way.', 'assets/img/poster/oh-my-venus.jpg', 'https://www.youtube.com/watch?v=ZJ1-Wq9qA0A'),
(24, 'Our Beloved Summer', 2021, 'Years after filming a viral high school documentary, two bickering ex-lovers are pulled back in front of the camera and into each other''s lives.', 'assets/img/poster/ous.jpg', 'https://www.youtube.com/watch?v=w3w908z_J2A'),
(25, 'Queen of Tears', 2024, 'The queen of department stores and the prince of supermarkets weather a marital crisis, until a miraculous resurgence of love begins to bloom.', 'assets/img/poster/qot.jpg', 'https://www.youtube.com/watch?v=38fK8mP2tZc'),
(26, 'Reply 1988', 2015, 'A heartwarming journey back to 1988 Seoul following five childhood friends and their families living in the close-knit neighborhood of Ssangmundong.', 'assets/img/poster/reply-1988.jpg', 'https://www.youtube.com/watch?v=pX_x0eU1L2M'),
(27, 'Resident Playbook', 2025, 'Spin-off of Hospital Playlist following the turbulent, earnest, and hilarious everyday lives of obstetrics and gynecology residents at Jongno Yulje Hospital.', 'assets/img/poster/resident-playbook.jpg', 'https://www.youtube.com/results?search_query=Resident+Playbook+kdrama+trailer'),
(28, 'Squid Game', 2021, 'Hundreds of cash-strapped players accept a strange invitation to compete in children''s games for a tempting prize, with deadly high stakes.', 'assets/img/poster/squid-game.jpg', 'https://www.youtube.com/watch?v=oqxAJKy0ii4'),
(29, 'Start-Up', 2020, 'Young entrepreneurs aspiring to launch virtual dreams into reality compete for success and romance in the cutthroat world of Korea''s high-tech industry.', 'assets/img/poster/start-up.jpg', 'https://www.youtube.com/watch?v=BemKyzbLDDw'),
(30, 'Sweet Home', 2020, 'As humans turn into savage monsters and wreak terror, one troubled teen and his apartment neighbors fight to hold onto their humanity and survive.', 'assets/img/poster/sweet-home.jpg', 'https://www.youtube.com/watch?v=7rI56NmD33Y'),
(31, 'The Atypical Family', 2024, 'Once blessed with unique superpowers, a family loses their abilities due to modern-day afflictions until a mysterious woman enters their lives.', 'assets/img/poster/taf.jpg', 'https://www.youtube.com/watch?v=aG0K0B8h1N4'),
(32, 'The Glory', 2022, 'Years after surviving horrific abuse in high school, a woman puts an elaborate revenge scheme in motion to make the perpetrators pay for their crimes.', 'assets/img/poster/the-glory.jpg', 'https://www.youtube.com/watch?v=tqVVCS_ucFA'),
(33, 'The Judge from Hell', 2024, 'A demon from hell possesses the body of an elite judge to punish remorseless criminals and send them straight to the underworld.', 'assets/img/poster/tjfh.jpg', 'https://www.youtube.com/watch?v=Qx_qV2N8H2A'),
(34, 'The Penthouse: War in Life', 2020, 'Residents of Hera Palace, a luxury 100-floor penthouse apartment, harbor dark secrets and fierce rivalries driven by greed and ambition.', 'assets/img/poster/tpl.jpg', 'https://www.youtube.com/watch?v=rW_8v0Y_xO0'),
(35, 'Under the Queen''s Umbrella', 2022, 'A spirited queen navigates palace rivalries and political intrigue while striving to rein in her unruly sons to turn one of them into the next Joseon king.', 'assets/img/poster/tq.jpg', 'https://www.youtube.com/watch?v=oV8I9x6qK_M'),
(36, 'Twinkling Watermelon', 2023, 'A CODA high school student with a gift for music time travels to 1995, where he forms a band with the teenage version of his father.', 'assets/img/poster/ttc.jpg', 'https://www.youtube.com/watch?v=bY2J8q_W7kA'),
(37, 'Vagabond', 2019, 'When a mysterious plane crash kills his nephew, a stuntman embarks on a dangerous quest to uncover a massive national corruption conspiracy.', 'assets/img/poster/vagabond.jpg', 'https://www.youtube.com/watch?v=2Tz8X-GvO2A'),
(38, 'When Life Gives You Tangerines', 2025, 'Follows the adventurous and bittersweet lives of Ae-soon, a rebellious dreamer, and Gwan-sik, an unyielding man of action, born on Jeju Island in the 1950s.', 'assets/img/poster/wlgyt.jpg', 'https://www.youtube.com/results?search_query=When+Life+Gives+You+Tangerines+kdrama+trailer'),
(39, 'What''s Wrong with Secretary Kim', 2018, 'An egotistical vice chairman of a major company is thrown into turmoil when his capable secretary of nine years suddenly announces her resignation.', 'assets/img/poster/wtpr.jpg', 'https://www.youtube.com/watch?v=x7E2P_P4y_0'),
(40, 'Welcome to Samdal-ri', 2023, 'After suffering a sudden fall from grace, a famous fashion photographer returns to her hometown on Jeju Island and reconnects with her childhood best friend.', 'assets/img/poster/wts.jpg', 'https://www.youtube.com/watch?v=9_n7Lw3pY1E')
ON CONFLICT (id) DO NOTHING;

-- 7. REVIEWS
INSERT INTO reviews (drama_id, rating, username, review_text) VALUES
(1, 10, 'kdrama_lover', 'Sangat menghibur dan lucu! Chemistry pemerannya luar biasa.'),
(1, 9, 'alvenath', 'Visual dan kulinernya bikin laper setiap nonton!'),
(2, 10, 'mafia_fan', 'Song Joong-ki as Vincenzo is legendary. One of the best crime comedies ever.'),
(3, 10, 'seoul_dweller', 'Masterpiece. Perfect balance of laughter, tears, and romance.'),
(25, 10, 'queen_fan', 'Kim Soo-hyun & Kim Ji-won chemistry broke all records for a reason.');

-- Reset serial sequences
SELECT setval('dramas_id_seq', (SELECT MAX(id) FROM dramas));
SELECT setval('actors_id_seq', (SELECT MAX(id) FROM actors));
SELECT setval('genres_id_seq', (SELECT MAX(id) FROM genres));
SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

