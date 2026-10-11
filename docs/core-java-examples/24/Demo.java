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
    static class Shape {
        int area() { return 0; }
    }
    static class Square extends Shape {
        @Override int area() { return 4 * 4; }
    }

    public static void main(String[] args) throws Exception {
        Shape shape = new Square();
        System.out.println(shape.area());
    }
}
