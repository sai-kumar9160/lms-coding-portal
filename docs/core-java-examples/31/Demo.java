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
    enum Status { PASSED, FAILED }
    record Result(String name, Status status) {}

    public static void main(String[] args) throws Exception {
        Result result = new Result("Anil", Status.PASSED);
        System.out.println(result.name() + " " + result.status());
    }
}
