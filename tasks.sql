-- MySQL dump 10.13  Distrib 8.0.32, for Linux (x86_64)
--
-- Host: localhost    Database: Tasks
-- ------------------------------------------------------
-- Server version       8.0.32

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4 ;
SET @@SESSION.SQL_MODE= 'NO_AUTO_VALUE_ON_ZERO' ;

--
-- Table structure for table `Tasks`
--

DROP TABLE IF EXISTS `Tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tasks` (
  `id` BIGINT,
  `position` SMALLINT NOT NULL,
  `data` NVARCHAR(4000),
  `done` BOOLEAN NOT NULL DEFAULT false,
  `pinned` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
CREATE INDEX idx_position ON tasks (position);
--
-- Dumping data for table `Tasks`
--

LOCK TABLES `Tasks` WRITE;
/*!40000 ALTER TABLE `Tasks` DISABLE KEYS */;
INSERT INTO `Tasks` VALUES (1,1,"Eat",false,false),(2,2,"Sleep",false,false),(3,3,"Repeat",false,false),(4,4,'[{"id": 41, "data": "Eat", "done": false}, {"id": 42, "data": "Sleep", "done": false}, {"id": 43, "data": "Repeat", "done": true}]',false,false);
/*!40000 ALTER TABLE `Tasks` ENABLE KEYS */;
UNLOCK TABLES;
