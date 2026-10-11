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
        String original = " Java ";
        String clean = original.trim();
        System.out.println(clean.equals("Java"));
        System.out.println(original.length());
        System.out.println(clean.substring(0, 2));
    }
}
