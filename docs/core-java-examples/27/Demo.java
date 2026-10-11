import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    static class Engine {
        void start() { System.out.println("Engine started"); }
    }
    static class Car {
        private final Engine engine;
        Car(Engine engine) { this.engine = engine; }
        void start() { engine.start(); }
    }

    public static void main(String[] args) throws Exception {
        Car car = new Car(new Engine());
        car.start();
    }
}
