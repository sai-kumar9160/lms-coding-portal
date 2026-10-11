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
    static class Animal {
        void eat() { System.out.println("Eating"); }
    }
    static class Dog extends Animal {
        void bark() { System.out.println("Woof"); }
    }

    public static void main(String[] args) throws Exception {
        Dog dog = new Dog();
        dog.eat();
        dog.bark();
    }
}
