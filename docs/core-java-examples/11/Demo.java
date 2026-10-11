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
    public static void main(String[] args) throws Exception {
        int mark = 76;
        if (mark < 0 || mark > 100) {
            System.out.println("Invalid mark");
        } else if (mark >= 75) {
            System.out.println("Distinction");
        } else if (mark >= 40) {
            System.out.println("Pass");
        } else {
            System.out.println("Fail");
        }
    }
}
